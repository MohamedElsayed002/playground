import io
import zipfile

import pytest
from fastapi import UploadFile
from pydantic import ValidationError
from starlette.datastructures import Headers

from app.core.config import Settings
from app.core.upload_validation import (
    CSV_UPLOAD_TYPES,
    PDF_UPLOAD_TYPES,
    validate_csv_bytes,
    validate_document_bytes,
    validate_pdf_bytes,
    validate_upload_metadata,
)
from app.exceptions.handlers import UnprocessableFileException
from app.schemas.order import OrderCheckoutCreate


def make_upload(filename: str, content_type: str) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=io.BytesIO(),
        headers=Headers({"content-type": content_type}),
    )


def test_default_upload_size_is_ten_mib():
    settings = Settings.model_construct(MAX_FILE_SIZE_MB=10)
    assert settings.max_file_size_bytes == 10 * 1024 * 1024


def test_checkout_rejects_oversized_notes():
    with pytest.raises(ValidationError):
        OrderCheckoutCreate(notes="x" * 2001)


def test_checkout_strips_and_rejects_blank_city():
    with pytest.raises(ValidationError):
        OrderCheckoutCreate(shipping_city="   ")


def test_pdf_requires_matching_extension_and_mime_type():
    upload = make_upload("report.txt", "application/pdf")
    with pytest.raises(UnprocessableFileException):
        validate_upload_metadata(upload, PDF_UPLOAD_TYPES, "PDF")


def test_pdf_signature_is_required():
    with pytest.raises(UnprocessableFileException):
        validate_pdf_bytes(b"this is not a pdf")


def test_docx_must_be_a_word_archive():
    with pytest.raises(UnprocessableFileException):
        validate_document_bytes(b"not a zip file", ".docx")


def test_csv_must_be_nonempty_utf8_text():
    validate_upload_metadata(
        make_upload("data.csv", "text/csv"), CSV_UPLOAD_TYPES, "CSV"
    )
    validate_csv_bytes(b"name,value\nitem,1\n")

    with pytest.raises(UnprocessableFileException):
        validate_csv_bytes(b"\xff\x00")


def test_docx_accepts_a_minimal_word_archive():
    content = io.BytesIO()
    with zipfile.ZipFile(content, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types />")
        archive.writestr("word/document.xml", "<document />")

    validate_document_bytes(content.getvalue(), ".docx")