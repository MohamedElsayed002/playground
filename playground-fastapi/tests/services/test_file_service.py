import io
from unittest.mock import Mock

import pytest
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.exceptions.handlers import UnprocessableFileException
from app.services import file_service


def make_upload(data, filename="report.pdf", content_type="application/pdf"):
    return UploadFile(file=io.BytesIO(data), filename=filename,
                      headers=Headers({"content-type": content_type}))


# Scenario: read upload chunks accepts exact limit.
@pytest.mark.asyncio
async def test_read_upload_chunks_accepts_exact_limit():
    """Scenario: upload bytes equal to the configured limit are accepted intact."""
    assert await file_service._read_upload_chunks(make_upload(b"12345"), 5) == b"12345"


# Scenario: read upload chunks rejects bytes over limit.
@pytest.mark.asyncio
async def test_read_upload_chunks_rejects_bytes_over_limit():
    """Scenario: chunked upload exceeding the limit fails before returning the full body."""
    with pytest.raises(UnprocessableFileException, match="maximum allowed size"):
        await file_service._read_upload_chunks(make_upload(b"123456"), 5)


def test_safe_filename_removes_path_and_preserves_lowercase_extension(monkeypatch):
    """Scenario: untrusted path-like names become unique basenames with safe extensions."""
    monkeypatch.setattr(file_service.uuid, "uuid4", lambda: type("UUID", (), {"hex": "abc123"})())
    assert file_service._safe_filename("../../private/Resume.PDF") == "abc123.pdf"


# Scenario: upload document rejects mismatched mime before s3.
@pytest.mark.asyncio
async def test_upload_document_rejects_mismatched_mime_before_s3(monkeypatch):
    """Scenario: a PDF extension paired with an image MIME type is rejected without storage."""
    put_object = Mock()
    monkeypatch.setattr(file_service.s3, "put_object", put_object)

    with pytest.raises(UnprocessableFileException, match="extension or content type"):
        await file_service.upload_document(make_upload(b"%PDF-1.7", content_type="image/png"))

    put_object.assert_not_called()


# Scenario: extract pdf rejects non pdf bytes before parser.
@pytest.mark.asyncio
async def test_extract_pdf_rejects_non_pdf_bytes_before_parser(monkeypatch):
    """Scenario: invalid PDF signatures fail validation before PDF parsing or LLM calls."""
    parser = Mock()
    llm = Mock()
    monkeypatch.setattr(file_service.pdfplumber, "open", parser)
    monkeypatch.setattr(file_service, "extract_structured_cv_data", llm)

    with pytest.raises(UnprocessableFileException, match="valid PDF"):
        await file_service.extract_pdf_content(make_upload(b"not a pdf"))

    parser.assert_not_called()
    llm.assert_not_called()
