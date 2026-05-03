
import uuid
import hashlib
import mimetypes
from pathlib import Path
import logging

import aiofiles
import pdfplumber
from fastapi import UploadFile, HTTPException, Request
from PIL import Image, UnidentifiedImageError
import io

from app.core.config import settings
from app.exceptions.handlers import UnprocessableFileException, ServiceUnavailableException
from app.schemas.file import FileUploadResponse, PDFExtractResponse, PDFPageContent
import boto3
from app.services.llm_service import  extract_structured_cv_data, safe_int
from app.schemas.analysis import CVStructuredData
import subprocess
import json
import os
import tempfile
import shutil
from sqlalchemy import select

import pyclamd
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.idempotency import IdempotencyKey
from app.models.file import File
from app.schemas.file import FileStatus
import inngest
from app.services.audit_service import create_audit_log
# from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)


# VERAPDF_JAR = r"C:\Users\moham\verapdf\bin\cli-1.30.1.jar"
VERAPDF_JAR = r"C:\Users\moham\verapdf\bin\cli-1.30.1.jar"
JAVA_PATH = r"C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot\bin\java.exe"

# Try to connect to ClamAV, but allow app to start if unavailable
# (ClamAV is Unix-only and may not be available on Windows dev machines)
cd = None
try:
    cd = pyclamd.ClamdUnixSocket()
    logger.info("ClamAV connected successfully")
except Exception as e:
    logger.warning(f"⚠️  ClamAV not available: {e} (virus scanning will be skipped)")

s3 = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
BUCKET_NAME = settings.BUCKET_NAME
# ── Helpers ───────────────────────────────────────────────────────────────────


async def _save_upload_to_temp(upload: UploadFile) -> str:
    temp = tempfile.NamedTemporaryFile(delete=False,suffix=".pdf")
    content = await upload.read()
    temp.write(content)
    temp.close()
    return temp.name

def _safe_filename(original: str) -> str:
    """
    Generate a unique, safe filename to prevent path traversal attacks
    and filename collisions. We keep the extension for content-type detection.
    
    "../../etc/passwd.jpg" → "a3f2b1c4d5e6.jpg"
    """
    suffix = Path(original).suffix.lower()
    unique_name = uuid.uuid4().hex
    return f"{unique_name}{suffix}"


async def _read_upload_chunks(upload: UploadFile, max_bytes: int) -> bytes:
    """
    Read an uploaded file in chunks, enforcing the max size limit.
    Raises an error BEFORE loading the entire file into memory if it's too large.
    """
    chunks = []
    total_read = 0
    chunk_size = 1024 * 64  # 64 KB chunks

    while True:
        chunk = await upload.read(chunk_size)
        if not chunk:
            break
        total_read += len(chunk)
        if total_read > max_bytes:
            raise UnprocessableFileException(
                f"File exceeds the maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
            )
        chunks.append(chunk)

    return b"".join(chunks)


# ── Image Upload ──────────────────────────────────────────────────────────────

async def upload_image(
    upload: UploadFile,
    subfolder: str = "images",
) -> FileUploadResponse:
    """
    Validate and save an uploaded image.
    
    Validation steps:
    1. Check MIME type is an allowed image type
    2. Check file size is within limit
    3. Try to actually open with Pillow (confirms it's a real image, not a renamed .exe)
    
    NestJS equivalent → FileTypeValidator + MaxFileSizeValidator in ParseFilePipe
    """
    # 1. MIME type check
    content_type = upload.content_type or ""
    if content_type not in settings.allowed_image_types_list:
        raise UnprocessableFileException(
            f"Invalid image type '{content_type}'. "
            f"Allowed: {', '.join(settings.allowed_image_types_list)}"
        )

    # 2. Read with size limit
    file_bytes = await _read_upload_chunks(upload, settings.max_file_size_bytes)

    # 3. Validate it's a real image using Pillow (magic byte check)
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()  # Raises if file is corrupted or not a real image
    except (UnidentifiedImageError, Exception):
        raise UnprocessableFileException("The uploaded file is not a valid image")

    # Generate safe unique filename
    filename = _safe_filename(upload.filename or "image.jpg")

    # Saving it locally
    # dest_dir = Path(settings.UPLOAD_DIR) / subfolder
    # dest_dir.mkdir(parents=True, exist_ok=True)
    # dest_path = dest_dir / filename


    # # Write async — doesn't block the event loop
    # async with aiofiles.open(dest_path, "wb") as f:
    #     await f.write(file_bytes)

    # url = f"/static/{subfolder}/{filename}"

    s3_key = f"{subfolder}/{filename}"

    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type
    )

    url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

    return FileUploadResponse(
        filename=filename,
        original_name=upload.filename or "image",
        url=url,
        size_bytes=len(file_bytes),
        content_type=content_type,
    )


# ── General File Upload ────────────────────────────────────────────────────────

async def upload_document(upload: UploadFile) -> FileUploadResponse:
    """
    Upload a document (PDF, etc.) with basic validation.
    """
    allowed_types = ["application/pdf", "application/msword",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

    content_type = upload.content_type or ""
    if content_type not in allowed_types:
        raise UnprocessableFileException(
            f"Invalid document type. Allowed: PDF, DOC, DOCX"
        )

    file_bytes = await _read_upload_chunks(upload, settings.max_file_size_bytes)

    filename = _safe_filename(upload.filename or "document.pdf")
    # dest_dir = Path(settings.UPLOAD_DIR) / "documents"
    # dest_dir.mkdir(parents=True, exist_ok=True)
    # dest_path = dest_dir / filename

    # async with aiofiles.open(dest_path, "wb") as f:
    #     await f.write(file_bytes)

    s3_key = f"/documents/{filename}"

    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type
    )

    url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

    return FileUploadResponse(
        filename=filename,
        original_name=upload.filename or "document",
        url=url,
        size_bytes=len(file_bytes),
        content_type=content_type,
    )


# PDF Extraction 

# PDF/A = Archival PDF

"""
It's a strict version of PDF designed for long-term storage

Unlike normal PDFs, it must:

- Embed all fonts 
- Avoid external dependencies (no remote images, no JS)
- Use standardized color profiles
- Be self-contained and reproducible forever

Normal PDF Looks fine today/ PDF/A will still look identical in 20 years

PDF/A is used in Banks, Governmental systems, Legal archives, Healthcare records
These systems require: Compliance, Long-term storage, Legal reliability. Regular users? Almost never

{
  "filename": "cv.pdf",
  "total_pages": 2,
  "pages": [...],
  "full_text": "...",
  "pdfa_compliant": false,
  "warning": "PDF is not PDF/A compliant"
}

## Recommended architecture 

1. Strict route (PDF/A only)
2. Flexible route (default) Accept any pdf, if not pdf/a return warning, still process

## Help non technical users to convert there pdf to be pdf/a

1- Auto fix: Convert PDF-> PDF/A internally lib `ghostscript`, `ocrmypdf`, `pikepdf`
2- Soft warning
3- Offer download upgrade "Download PDF/A version" / "Convert on demand"

---

PDF/A is not random. It belongs to this category 

"Strict standards that guarantee consistency, security, and auditability
"""


class PDFValidationError(Exception):
    pass


def validate_pdf(path):
    result = subprocess.run(
        [JAVA_PATH, "-jar", VERAPDF_JAR, "--format", "json", path],
        capture_output=True,
        text=True,
        timeout=30
    )

    if result.returncode not in (0, 1):
        raise PDFValidationError(f"veraPDF crashed: {result.stderr}")

    try:
        data = json.loads(result.stdout)

        report = data.get("report")
        if not report:
            raise ValueError("Missing report")

        jobs = report.get("jobs", [])
        if not jobs:
            raise ValueError("No jobs found")

        validation_list = jobs[0].get("validationResult", [])
        if not validation_list:
            raise ValueError("No validation result")

        validation = validation_list[0]

        return {
            "is_compliant": validation.get("compliant"),
            "statement": validation.get("statement"),
            "details": validation.get("details", {}),
        }

    except Exception as e:
        raise PDFValidationError(f"Invalid veraPDF output: {e}")
    

def scan_file(file_bytes: bytes):
    """
    Scan file for malware using ClamAV.
    If ClamAV is not available, skip scanning (development only).
    """
    if cd is None:
        logger.debug("⚠️  ClamAV not available - skipping virus scan")
        return
    
    try:
        result = cd.scan_stream(file_bytes)
        if result is not None:
            raise Exception("Virus detected")
    except Exception as e:
        logger.error(f"Virus scan failed: {e}")
        raise

async def extract_pdf_content(upload: UploadFile) -> PDFExtractResponse:

    if upload.content_type != "application/pdf":
        raise UnprocessableFileException("Only PDF files are supported")

    #  STEP 1: Save file to disk (needed for veraPDF)
    temp_path = await _save_upload_to_temp(upload)

    try:
        #  STEP 2: Validate BEFORE parsing
        # validation = validate_pdf(temp_path)

        # if not validation["is_compliant"]:
            #  Strict mode (reject)
            # raise UnprocessableFileException(
            #     # "PDF is not PDF/A compliant (may contain unsafe content)"
            # )
            # return {
            #     "warning": "PDF is not PDF/A compliant",
            #     "allow": True
            # }

        with open(temp_path, "rb") as f:
            file_bytes = f.read()

            scan_file(file_bytes)

        pages_content: list[PDFPageContent] = []
        all_text_parts: list[str] = []

        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
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

                    pages_content.append(PDFPageContent(
                        page_number=page_num,
                        text=text,
                        tables=tables,
                    ))

                    all_text_parts.append(f"--- Page {page_num} ---\n{text}")

        except Exception as e:
            raise UnprocessableFileException(f"Failed to parse PDF: {str(e)}")

        full_text = "\n\n".join(all_text_parts)

        structured_data = None

        try:
            raw_structured = await extract_structured_cv_data(full_text)
            structured_data = CVStructuredData(**raw_structured)
            structured_data.years_of_experience = safe_int(
                structured_data.years_of_experience
            )
        except Exception as e:
            print("LLM extraction failed", e)

        return PDFExtractResponse(
            filename=upload.filename or "document.pdf",
            total_pages=total_pages,
            pages=pages_content,
            full_text=full_text,
            structured_data=structured_data
        )

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ── Authenticated PDF Upload with Idempotency ──────────────────────────────────

"""
 IDEMPOTENCY PATTERN:

The idempotency pattern ensures that identical requests produce the same result,
even if called multiple times. This is crucial for:

- Network failures: Client retries → Server should return same response
- User double-clicks: Same upload request twice → Same file, not duplicates  
- UI bugs: Form submitted multiple times → Only one file created

FLOW:
1. Client sends: idempotency_key (usually UUID in headers)
2. Server checks: Does this key exist in IdempotencyKey table?
    YES  → Return cached response (no processing)
    NO   → Process request, cache result, return response
3. Future identical requests: Get cached response instantly

KEY BENEFITS:
- Prevents duplicate file entries
- Saves processing time on retries
- Safe for user errors (accidental double-submit)
- Database constraint: (filename, user_id) prevents actual duplicates too
"""

"""
1. Request comes in 
2. Check idempotency 
3. Start transaction 
4. Save DB record
5. Upload file
6. Commit or rollback 
7. Return consistent response
"""


"""
1. User uploads file
2. API Saves record (status = Uploading)
3. API pushes job to queue (Inngest)
4. API return immediately

5. Worker processes pDF
6. Updates DB (Processing -> Completed / Failed)
"""

"""
Client -> FastAPI -> Save file -> Send event -> response (fast)
                                        |
                                 Inngest Worker
                                        |
                                 process PDF + LLM + DB
"""

async def upload_pdf_authenticated(
    upload: UploadFile,
    user_id: int,
    idempotency_key: str,
    db: AsyncSession,
    request: Request | None = None,
) -> dict:
    """
    Thin handler: validate → save to S3 → create DB record → fire Inngest event.
    Returns immediately. Heavy processing happens in the Inngest background worker.
    """
    from app.services.inngest import inngest_client

    async def audit_upload_step(event: str, status: str, **metadata) -> None:
        await create_audit_log(
            db=None,
            event=event,
            status=status,
            user_id=user_id,
            request=request,
            metadata={
                "request_id": getattr(request.state, "request_id", None) if request else None,
                "idempotency_key": idempotency_key,
                "original_filename": upload.filename,
                "content_type": upload.content_type,
                **metadata,
            },
        )

    await audit_upload_step(
        event="PDF_UPLOAD_RECEIVED",
        status="SUCCESS",
    )

    #  STEP 1: Idempotency check 
    result = await db.execute(
        select(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key)
    )
    existing_key = result.scalars().first()

    if existing_key and existing_key.response:
        await audit_upload_step(
            event="PDF_UPLOAD_IDEMPOTENCY_HIT",
            status="SUCCESS",
        )
        return json.loads(existing_key.response)

    #  STEP 2: Validate file type 
    if upload.content_type != "application/pdf":
        await audit_upload_step(
            event="PDF_UPLOAD_VALIDATION_FAILED",
            status="FAILED",
            reason="invalid_content_type",
        )
        raise UnprocessableFileException("Only PDF files are supported")

    safe_name = _safe_filename(upload.filename or "document.pdf")

    #  STEP 3: Duplicate check 
    existing_file = await db.execute(
        select(File).filter(
            File.filename == safe_name,
            File.user_id == user_id
        )
    )
    existing_file = existing_file.scalars().first()

    if existing_file:
        if existing_file.status == FileStatus.FAILED:
            file_record = existing_file
            file_record.status = FileStatus.UPLOADING
            file_record.error_message = None
            file_record.idempotency_key = idempotency_key
            await audit_upload_step(
                event="PDF_UPLOAD_RETRYING_FAILED_RECORD",
                status="SUCCESS",
                file_id=file_record.id,
                safe_filename=safe_name,
            )
        else:
            await audit_upload_step(
                event="PDF_UPLOAD_DUPLICATE_REJECTED",
                status="FAILED",
                file_id=existing_file.id,
                safe_filename=safe_name,
                current_status=existing_file.status.value,
            )
            raise UnprocessableFileException(
                f"You already uploaded a file named '{upload.filename}'"
            )
    else:
        file_record = File(
            filename=safe_name,
            user_id=user_id,
            status=FileStatus.UPLOADING,
            idempotency_key=idempotency_key,
        )
        db.add(file_record)
        await db.flush()
        await audit_upload_step(
            event="PDF_UPLOAD_DB_RECORD_CREATED",
            status="SUCCESS",
            file_id=file_record.id,
            safe_filename=safe_name,
        )

    #  STEP 4: Read file & upload to S3 
    try:
        file_bytes = await _read_upload_chunks(upload, settings.max_file_size_bytes)
        await audit_upload_step(
            event="PDF_UPLOAD_FILE_READ",
            status="SUCCESS",
            file_id=file_record.id,
            safe_filename=safe_name,
            size_bytes=len(file_bytes),
        )

        s3_key = f"uploads/pdf/{user_id}/{safe_name}"
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_bytes,
            ContentType="application/pdf",
        )
        await audit_upload_step(
            event="PDF_UPLOAD_S3_STORED",
            status="SUCCESS",
            file_id=file_record.id,
            safe_filename=safe_name,
            s3_key=s3_key,
        )

        file_record.status = FileStatus.PROCESSING
        await db.commit()
        await audit_upload_step(
            event="PDF_UPLOAD_PROCESSING_STARTED",
            status="SUCCESS",
            file_id=file_record.id,
            safe_filename=safe_name,
            s3_key=s3_key,
        )

    except Exception as e:
        await db.rollback()
        file_record.status = FileStatus.FAILED
        file_record.error_message = str(e)
        db.add(file_record)
        await db.commit()
        await audit_upload_step(
            event="PDF_UPLOAD_FAILED",
            status="FAILED",
            file_id=getattr(file_record, "id", None),
            safe_filename=safe_name,
            error=str(e),
        )
        raise UnprocessableFileException(str(e))

    #  STEP 5: Fire Inngest event (returns immediately) 
    event_payload = {
        "file_id": file_record.id,
        "user_id": user_id,
        "s3_key": s3_key,
        "filename": upload.filename or "document.pdf",
        "idempotency_key": idempotency_key,
    }

    try:
        await inngest_client.send(
            inngest.Event(
                name="pdf/upload.requested",
                data=event_payload,
            )
        )
        await audit_upload_step(
            event="PDF_UPLOAD_INNGEST_EVENT_SENT",
            status="SUCCESS",
            file_id=file_record.id,
            safe_filename=safe_name,
            s3_key=s3_key,
        )
    except Exception as e:
        file_record.status = FileStatus.FAILED
        file_record.error_message = f"Inngest dispatch failed: {str(e)}"
        db.add(file_record)
        await db.commit()
        await audit_upload_step(
            event="PDF_UPLOAD_INNGEST_EVENT_FAILED",
            status="FAILED",
            file_id=file_record.id,
            safe_filename=safe_name,
            s3_key=s3_key,
            error=str(e),
        )
        raise ServiceUnavailableException(
            "PDF uploaded, but background processing could not be queued. Please try again."
        )

    logger.info(f"Inngest event sent for file {file_record.id}")

    #  Return immediately (client will poll for status) 
    return {
        "file_id": file_record.id,
        "filename": safe_name,
        "status": FileStatus.PROCESSING.value,
        "message": "PDF uploaded. Processing in background.",
    }


async def llm_response_status_result(file_id: int, user_id: int, db: AsyncSession):
    """
    Poll the processing status of an uploaded PDF and return the result if completed.
    """
    # Find the file record (must belong to current user)
    result = await db.execute(
        select(File).filter(
            File.id == file_id,
            File.user_id == user_id,
        )
    )
    file_record = result.scalars().first()

    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    # Still processing
    if file_record.status == FileStatus.PROCESSING:
        return {
            "file_id": file_id,
            "status": FileStatus.PROCESSING.value,
            "message": "Still processing. Poll again in a few seconds.",
        }

    # Failed
    if file_record.status == FileStatus.FAILED:
        return {
            "file_id": file_id,
            "status": FileStatus.FAILED.value,
            "error": file_record.error_message,
        }

    # Completed — return the cached full result
    if file_record.status == FileStatus.COMPLETED:
        # Direct lookup (new records have idempotency_key stored)
        if file_record.idempotency_key:
            idem_result = await db.execute(
                select(IdempotencyKey).filter(
                    IdempotencyKey.key == file_record.idempotency_key
                )
            )
            idem_record = idem_result.scalars().first()

            if idem_record and idem_record.response:
                return {
                    "file_id": file_id,
                    "status": FileStatus.COMPLETED.value,
                    "result": json.loads(idem_record.response),
                }

        # Fallback for legacy records: search by file_id in cached responses
        all_keys_result = await db.execute(select(IdempotencyKey))
        for key in all_keys_result.scalars().all():
            if key.response:
                try:
                    cached = json.loads(key.response)
                    if cached.get("file_id") == file_id:
                        return {
                            "file_id": file_id,
                            "status": FileStatus.COMPLETED.value,
                            "result": cached,
                        }
                except json.JSONDecodeError:
                    continue

        # Truly missing
        return {
            "file_id": file_id,
            "status": FileStatus.COMPLETED.value,
            "message": "Processing completed but cached result not found.",
        }

    # Unknown / uploading
    return {
        "file_id": file_id,
        "status": file_record.status.value,
    }





