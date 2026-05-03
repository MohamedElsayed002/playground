import asyncio
import logging
import json
import io

import inngest
import pdfplumber

from app.core.config import settings
from app.schemas.file import FileStatus, PDFPageContent
from app.schemas.analysis import CVStructuredData
from app.services.llm_service import extract_structured_cv_data, safe_int
from app.services.file_service import scan_file, s3, BUCKET_NAME

# npx --yes inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest

logger = logging.getLogger("uvicorn")


def _parse_pdf_bytes(raw_bytes: bytes) -> dict:
    """Parse a PDF using pdfplumber on a worker thread.

    This helper keeps the async Inngest step from blocking the main event loop
    while reading pages and extracting tables from a PDF.
    """
    pages = []
    all_text_parts = []

    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        total_pages = len(pdf.pages)

        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            raw_tables = page.extract_tables() or []

            tables = [
                [
                    [cell if cell is not None else "" for cell in row]
                    for row in table
                ]
                for table in raw_tables
            ]

            pages.append({
                "page_number": page_num,
                "text": text,
                "tables": tables,
            })

            all_text_parts.append(f"--- Page {page_num} ---\n{text}")

    full_text = "\n\n".join(all_text_parts)

    return {
        "total_pages": total_pages,
        "pages": pages,
        "full_text": full_text,
    }

_is_production = settings.INNGEST_SIGNING_KEY not in (None, "", "local-dev-key")

inngest_client = inngest.Inngest(
    app_id="playground_fastapi",
    logger=logger,
    is_production=_is_production,
    signing_key=settings.INNGEST_SIGNING_KEY if _is_production else None,
    event_key=settings.INNGEST_EVENT_KEY if _is_production else None,
)


@inngest_client.create_function(
    fn_id="process-pdf-upload",
    trigger=inngest.TriggerEvent(event="pdf/upload.requested"),
    retries=2,
)
async def process_pdf_upload(
    ctx: inngest.Context,
):
    step = ctx.step
    """
    Background worker that processes a PDF upload in discrete, retryable steps.

    Event payload (ctx.event.data):
        file_id      – DB primary key of the File record
        user_id      – owner of the file
        s3_key       – location of the raw PDF in S3
        filename     – original filename from the user
        idempotency_key – for caching the final response
    """

    data = ctx.event.data
    file_id: int = data["file_id"]
    user_id: int = data["user_id"]
    s3_key: str = data["s3_key"]
    filename: str = data["filename"]
    idempotency_key: str = data["idempotency_key"]

    # STEP 1 — Download file from S3 & virus scan
    async def download_and_scan():
        logger.info(f"[inngest] step 1: download {s3_key} from s3")

        def blocking_work():
            response = s3.get_object(Bucket=BUCKET_NAME,Key=s3_key)
            file_bytes = response["Body"].read()
            scan_file(file_bytes)
            return file_bytes

        file_bytes = await asyncio.to_thread(blocking_work)
        logger.info(f"[inngest] step 1 done: {len(file_bytes)} bytes, scan passed")
        return file_bytes.hex()

    file_hex: str = await step.run("download-and-scan", download_and_scan)

    # STEP 2 — Parse PDF pages (text + tables)
    async def parse_pdf():
        logger.info("[inngest] step 2: parsing PDF")
        raw_bytes = bytes.fromhex(file_hex)

        pdf_data = await asyncio.to_thread(_parse_pdf_bytes, raw_bytes)

        logger.info(f"[inngest] step 2 done: {pdf_data['total_pages']} pages extracted")
        return pdf_data

    pdf_data: dict = await step.run("parse-pdf", parse_pdf)

    # STEP 3 — LLM structured extraction
    async def llm_extract():
        logger.info("[inngest] step 3: LLM extraction")

        structured_data = None
        try:
            raw_structured = await extract_structured_cv_data(pdf_data["full_text"])
            cv = CVStructuredData(**raw_structured)
            cv.years_of_experience = safe_int(cv.years_of_experience)
            structured_data = cv.dict()
        except Exception as e:
            logger.warning(f"[inngest] LLM extraction failed: {e}")

        logger.info("[inngest] step 3 done")
        return structured_data

    structured_data: dict | None = await step.run("llm-extract", llm_extract)

    # STEP 4 — Persist results to DB (File status + IdempotencyKey cache)
    async def save_to_db():
        logger.info("[inngest] step 4: saving results to DB")

        from sqlalchemy import select
        from app.db.session import AsyncSessionLocal
        from app.models.file import File
        from app.models.idempotency import IdempotencyKey

        db = AsyncSessionLocal()

        try:
            # Build the final response payload
            response_payload = {
                "file_id": file_id,
                "filename": filename,
                "total_pages": pdf_data["total_pages"],
                "pages": pdf_data["pages"],
                "full_text": pdf_data["full_text"],
                "structured_data": structured_data,
            }

            response_json = json.dumps(response_payload)

            # Update file status
            result = await db.execute(
                select(File).filter(File.id == file_id)
            )
            file_record = result.scalars().first()

            if file_record:
                file_record.status = FileStatus.COMPLETED
                file_record.error_message = None

            # Save idempotency cache
            existing_idem = await db.execute(
                select(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key)
            )
            if not existing_idem.scalars().first():
                db.add(IdempotencyKey(
                    key=idempotency_key,
                    response=response_json,
                ))

            await db.commit()
            logger.info(f"[inngest] step 4 done: file {file_id} → COMPLETED")

        except Exception as e:
            await db.rollback()

            # Mark file as FAILED
            try:
                result = await db.execute(
                    select(File).filter(File.id == file_id)
                )
                file_record = result.scalars().first()
                if file_record:
                    file_record.status = FileStatus.FAILED
                    file_record.error_message = str(e)
                await db.commit()
            except Exception:
                await db.rollback()

            raise  # let Inngest retry

        finally:
            await db.close()

    await step.run("save-to-db", save_to_db)

    return {"status": "completed", "file_id": file_id}


# ── Export list of functions for main.py
inngest_functions = [process_pdf_upload]