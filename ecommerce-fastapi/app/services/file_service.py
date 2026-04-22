
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


# ── Helpers ───────────────────────────────────────────────────────────────────

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
    dest_dir = Path(settings.UPLOAD_DIR) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    # Write async — doesn't block the event loop
    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(file_bytes)

    url = f"/static/{subfolder}/{filename}"

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
    dest_dir = Path(settings.UPLOAD_DIR) / "documents"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(file_bytes)

    return FileUploadResponse(
        filename=filename,
        original_name=upload.filename or "document",
        url=f"/static/documents/{filename}",
        size_bytes=len(file_bytes),
        content_type=content_type,
    )


# ── PDF Extraction ─────────────────────────────────────────────────────────────

async def extract_pdf_content(upload: UploadFile) -> PDFExtractResponse:
    """
    Extract text and tables from every page of a PDF.
    
    Uses pdfplumber which handles:
    - Text extraction with layout awareness
    - Table detection and extraction
    - Multi-column PDFs
    
    The extracted data can be used for:
    - Full-text search indexing
    - AI/LLM processing
    - Data pipeline ingestion
    """
    if upload.content_type != "application/pdf":
        raise UnprocessableFileException("Only PDF files are supported for text extraction")

    file_bytes = await _read_upload_chunks(upload, settings.max_file_size_bytes)

    # pdfplumber works with file-like objects — we use BytesIO to avoid writing to disk
    pages_content: list[PDFPageContent] = []
    all_text_parts: list[str] = []

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            total_pages = len(pdf.pages)

            for page_num, page in enumerate(pdf.pages, start=1):
                # Extract text — pdfplumber preserves layout better than PyPDF2
                text = page.extract_text() or ""

                # Extract tables — returns list of tables, each table = list of rows
                # Each row = list of cell values (strings or None for empty cells)
                raw_tables = page.extract_tables() or []

                # Clean up None values in cells
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

    return PDFExtractResponse(
        filename=upload.filename or "document.pdf",
        total_pages=total_pages,
        pages=pages_content,
        full_text=full_text,
    )
