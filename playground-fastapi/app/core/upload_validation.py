import csv
import io
from pathlib import Path
from zipfile import BadZipFile, ZipFile

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.exceptions.handlers import UnprocessableFileException

IMAGE_UPLOAD_TYPES = {
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".webp": {"image/webp"},
    ".gif": {"image/gif"},
}
IMAGE_FORMATS = {
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".png": "PNG",
    ".webp": "WEBP",
    ".gif": "GIF",
}
DOCUMENT_UPLOAD_TYPES = {
    ".pdf": {"application/pdf"},
    ".doc": {"application/msword"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    },
}
PDF_UPLOAD_TYPES = {".pdf": {"application/pdf"}}
CSV_UPLOAD_TYPES = {
    ".csv": {
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "text/plain",
        "application/octet-stream",
    }
}


def validate_upload_metadata(
    upload: UploadFile,
    allowed_types: dict[str, set[str]],
    label: str,
) -> str:
    extension = Path(upload.filename or "").suffix.lower()
    media_type = (upload.content_type or "").split(";", maxsplit=1)[0].strip().lower()
    expected_types = allowed_types.get(extension)

    if expected_types is None or media_type not in expected_types:
        raise UnprocessableFileException(
            f"Invalid {label} file extension or content type"
        )

    return extension


def validate_image_bytes(file_bytes: bytes, extension: str) -> None:
    try:
        with Image.open(io.BytesIO(file_bytes)) as image:
            actual_format = image.format
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError) as error:
        raise UnprocessableFileException(
            "The uploaded file is not a valid image"
        ) from error

    if actual_format != IMAGE_FORMATS.get(extension):
        raise UnprocessableFileException(
            "The image content does not match its file extension"
        )


def validate_document_bytes(file_bytes: bytes, extension: str) -> None:
    if extension == ".pdf":
        validate_pdf_bytes(file_bytes)
        return

    if extension == ".doc":
        if not file_bytes.startswith(bytes.fromhex("D0CF11E0A1B11AE1")):
            raise UnprocessableFileException("The uploaded file is not a valid DOC")
        return

    if extension == ".docx":
        try:
            with ZipFile(io.BytesIO(file_bytes)) as archive:
                entries = set(archive.namelist())
        except (BadZipFile, OSError) as error:
            raise UnprocessableFileException(
                "The uploaded file is not a valid DOCX"
            ) from error

        if "[Content_Types].xml" not in entries or "word/document.xml" not in entries:
            raise UnprocessableFileException("The uploaded file is not a valid DOCX")
        return

    raise UnprocessableFileException("Unsupported document type")


def validate_pdf_bytes(file_bytes: bytes) -> None:
    if b"%PDF-" not in file_bytes[:1024]:
        raise UnprocessableFileException("The uploaded file is not a valid PDF")


def validate_csv_bytes(file_bytes: bytes) -> None:
    if not file_bytes or b"\x00" in file_bytes:
        raise UnprocessableFileException("The uploaded file is not valid CSV text")

    try:
        text = file_bytes.decode("utf-8-sig")
        rows = csv.reader(io.StringIO(text), strict=True)
        if not any(any(cell.strip() for cell in row) for row in rows):
            raise UnprocessableFileException("The CSV file is empty")
    except (UnicodeDecodeError, csv.Error) as error:
        raise UnprocessableFileException(
            "The uploaded CSV must be valid UTF-8 text"
        ) from error