import asyncio
import io
import json

import inngest
import pdfplumber

from app.schemas.analysis import CVStructuredData
from app.schemas.file import FileStatus
from app.services.file_service import BUCKET_NAME, s3, scan_file
from app.services.inngest.client import inngest_client, logger
from app.services.llm_service import extract_structured_cv_data, safe_int


def _parse_pdf_bytes(raw_bytes: bytes) -> dict:
    pages = []
    all_text_parts = []

    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        total_pages = len(pdf.pages)
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            raw_tables = page.extract_tables() or []
            tables = [
                [[cell if cell is not None else "" for cell in row] for row in table]
                for table in raw_tables
            ]
            pages.append({"page_number": page_num, "text": text, "tables": tables})
            all_text_parts.append(f"--- Page {page_num} ---\n{text}")

    return {
        "total_pages": total_pages,
        "pages": pages,
        "full_text": "\n\n".join(all_text_parts),
    }


@inngest_client.create_function(
    fn_id="process-pdf-upload",
    trigger=inngest.TriggerEvent(event="pdf/upload.requested"),
    retries=2,
)
async def process_pdf_upload(ctx: inngest.Context):
    step = ctx.step
    data = ctx.event.data
    file_id: int = data["file_id"]
    s3_key: str = data["s3_key"]
    filename: str = data["filename"]
    idempotency_key: str = data["idempotency_key"]

    async def download_and_scan():
        logger.info("[inngest] step 1: download %s from s3", s3_key)

        def blocking_work():
            response = s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
            file_bytes = response["Body"].read()
            scan_file(file_bytes)
            return file_bytes

        file_bytes = await asyncio.to_thread(blocking_work)
        return file_bytes.hex()

    file_hex: str = await step.run("download-and-scan", download_and_scan)

    async def parse_pdf():
        raw_bytes = bytes.fromhex(file_hex)
        return await asyncio.to_thread(_parse_pdf_bytes, raw_bytes)

    pdf_data: dict = await step.run("parse-pdf", parse_pdf)

    async def llm_extract():
        try:
            raw_structured = await extract_structured_cv_data(pdf_data["full_text"])
            cv = CVStructuredData(**raw_structured)
            cv.years_of_experience = safe_int(cv.years_of_experience)
            return cv.dict()
        except Exception as exc:
            logger.warning("[inngest] LLM extraction failed: %s", exc)
            return None

    structured_data: dict | None = await step.run("llm-extract", llm_extract)

    async def save_to_db():
        from sqlalchemy import select
        from app.db.session import AsyncSessionLocal
        from app.models.file import File
        from app.models.idempotency import IdempotencyKey

        db = AsyncSessionLocal()
        try:
            response_payload = {
                "file_id": file_id,
                "filename": filename,
                "total_pages": pdf_data["total_pages"],
                "pages": pdf_data["pages"],
                "full_text": pdf_data["full_text"],
                "structured_data": structured_data,
            }
            response_json = json.dumps(response_payload)

            result = await db.execute(select(File).filter(File.id == file_id))
            file_record = result.scalars().first()
            if file_record:
                file_record.status = FileStatus.COMPLETED
                file_record.error_message = None

            existing_idem = await db.execute(
                select(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key)
            )
            if not existing_idem.scalars().first():
                db.add(IdempotencyKey(key=idempotency_key, response=response_json))

            await db.commit()
        except Exception as exc:
            await db.rollback()
            try:
                result = await db.execute(select(File).filter(File.id == file_id))
                file_record = result.scalars().first()
                if file_record:
                    file_record.status = FileStatus.FAILED
                    file_record.error_message = str(exc)
                await db.commit()
            except Exception:
                await db.rollback()
            raise
        finally:
            await db.close()

    await step.run("save-to-db", save_to_db)
    return {"status": "completed", "file_id": file_id}
