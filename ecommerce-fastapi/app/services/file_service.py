
import uuid
import hashlib
import mimetypes
from pathlib import Path

import aiofiles
import pdfplumber
from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
import io

from app.core.config import settings
from app.exceptions.handlers import UnprocessableFileException
from app.schemas.file import FileUploadResponse, PDFExtractResponse, PDFPageContent
import boto3
from app.services.llm_service import  extract_structured_cv_data, safe_int
from app.schemas.analysis import CVStructuredData
import subprocess
import json
import os
import tempfile
import shutil

import pyclamd


# VERAPDF_JAR = r"C:\Users\moham\verapdf\bin\cli-1.30.1.jar"
VERAPDF_JAR = r"C:\Users\moham\verapdf\bin\cli-1.30.1.jar"
JAVA_PATH = r"C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot\bin\java.exe"
cd = pyclamd.ClamdUnixSocket()

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
    result = cd.scan_stream(file_bytes)

    if result is not None:
        raise Exception("Virus detected")

async def extract_pdf_content(upload: UploadFile) -> PDFExtractResponse:

    if upload.content_type != "application/pdf":
        raise UnprocessableFileException("Only PDF files are supported")

    # ✅ STEP 1: Save file to disk (needed for veraPDF)
    temp_path = await _save_upload_to_temp(upload)

    try:
        # ✅ STEP 2: Validate BEFORE parsing
        # validation = validate_pdf(temp_path)

        # if not validation["is_compliant"]:
            # 🔴 Strict mode (reject)
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