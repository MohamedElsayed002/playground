"""Scenario tests for CSV upload validation, idempotency, and job dispatch."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from starlette.datastructures import Headers

from app.exceptions.handlers import UnprocessableFileException
from app.services import csv_extract


def upload_csv(payload=b"name,price\nWidget,10\n", filename="items.csv"):
    return UploadFile(file=__import__("io").BytesIO(payload), filename=filename,
                      headers=Headers({"content-type": "text/csv"}))


def db_result(value=None):
    return SimpleNamespace(scalar_one_or_none=lambda: value)


# Scenario: csv pipeline replays completed idempotency key.
@pytest.mark.asyncio
async def test_csv_pipeline_replays_completed_idempotency_key(monkeypatch):
    """Scenario: a completed key replays its response without another upload or job."""
    result = SimpleNamespace(response_body='{"job_id":"job-1"}')
    db = SimpleNamespace(execute=AsyncMock(return_value=db_result(result)), add=Mock(), commit=AsyncMock())
    audit = AsyncMock()
    put_object = Mock()
    monkeypatch.setattr(csv_extract, "create_audit_log", audit)
    monkeypatch.setattr(csv_extract.s3, "put_object", put_object)

    response = await csv_extract.extract_csv_pipeline(upload_csv(), db, "key")

    assert response["job_id"] == "job-1"
    assert response["success"] is True
    db.execute.assert_awaited_once()
    db.add.assert_not_called()
    db.commit.assert_not_awaited()
    put_object.assert_not_called()


# Scenario: csv pipeline rejects invalid csv before side effects.
@pytest.mark.asyncio
async def test_csv_pipeline_rejects_invalid_csv_before_side_effects(monkeypatch):
    """Scenario: invalid UTF-8 CSV is rejected before idempotency or storage writes."""
    db = SimpleNamespace(execute=AsyncMock(return_value=db_result(None)), add=Mock(), commit=AsyncMock())
    put_object = Mock()
    monkeypatch.setattr(csv_extract.s3, "put_object", put_object)

    with pytest.raises(UnprocessableFileException, match="valid UTF-8"):
        await csv_extract.extract_csv_pipeline(upload_csv(b"\xff\xfe", "bad.csv"), db, "key")

    db.add.assert_not_called()
    db.commit.assert_not_awaited()
    put_object.assert_not_called()


# Scenario: csv pipeline returns processing for inflight key.
@pytest.mark.asyncio
async def test_csv_pipeline_returns_processing_for_inflight_key(monkeypatch):
    """Scenario: an existing unfinished key returns HTTP 202 without uploading again."""
    record = SimpleNamespace(response_body=None)
    db = SimpleNamespace(execute=AsyncMock(return_value=db_result(record)), add=Mock(), commit=AsyncMock())
    put_object = Mock()
    monkeypatch.setattr(csv_extract.s3, "put_object", put_object)

    response = await csv_extract.extract_csv_pipeline(upload_csv(), db, "busy-key")

    assert isinstance(response, JSONResponse)
    assert response.status_code == 202
    db.add.assert_not_called()
    put_object.assert_not_called()
