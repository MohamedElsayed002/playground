from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4
from decimal import Decimal

import pytest

from app.exceptions.handlers import BadRequestException, NotFoundException
from app.services import normalized_data_service as service


def result(value=None):
    return SimpleNamespace(scalar_one_or_none=lambda: value)


# Scenario: create normalized product rejects missing required fields.
@pytest.mark.asyncio
@pytest.mark.parametrize("field", ["product_id", "product_name", "price", "quantity"])
async def test_create_normalized_product_rejects_missing_required_fields(monkeypatch, field):
    """Scenario: every required normalized field is validated before querying or writing."""
    db = SimpleNamespace(execute=AsyncMock(), add=Mock(), commit=AsyncMock())
    data = {"product_id": "p-1", "product_name": "Widget", "price": 2.5, "quantity": 3}
    del data[field]

    with pytest.raises(BadRequestException, match="Missing required fields"):
        await service.create_normalized_product(db, uuid4(), data)

    db.execute.assert_not_awaited()
    db.add.assert_not_called()


# Scenario: create normalized product requires existing report job.
@pytest.mark.asyncio
async def test_create_normalized_product_requires_existing_report_job():
    """Scenario: normalized products cannot be attached to an unknown report job."""
    db = SimpleNamespace(execute=AsyncMock(return_value=result(None)), add=Mock(), commit=AsyncMock())

    with pytest.raises(NotFoundException):
        await service.create_normalized_product(
            db, uuid4(), {"product_id": "p-1", "product_name": "Widget", "price": 2, "quantity": 1}
        )

    db.add.assert_not_called()
    db.commit.assert_not_awaited()


# Scenario: create normalized product trims text and persists.
@pytest.mark.asyncio
async def test_create_normalized_product_trims_text_and_persists(monkeypatch):
    """Scenario: valid rows are normalized, audited, committed, and refreshed."""
    job_id = uuid4()
    db = SimpleNamespace(execute=AsyncMock(return_value=result(object())), add=Mock(),
                         commit=AsyncMock(), refresh=AsyncMock())
    audit = AsyncMock()
    monkeypatch.setattr(service, "create_audit_log", audit)

    product = await service.create_normalized_product(db, job_id, {
        "product_id": " p-1 ", "product_name": " Widget ", "category": " Tools ",
        "price": Decimal("12.50"), "quantity": "4",
    })

    assert (product.product_id, product.product_name, product.category) == ("p-1", "Widget", "Tools")
    assert product.price == Decimal("12.50")
    assert product.quantity == 4
    assert product.job_id == job_id
    db.add.assert_called_once_with(product)
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(product)
    audit.assert_awaited_once()


# Scenario: get normalized product rejects product from another job.
@pytest.mark.asyncio
async def test_get_normalized_product_rejects_product_from_another_job():
    """Scenario: product lookup is scoped by both product ID and report job ID."""
    db = SimpleNamespace(execute=AsyncMock(return_value=result(None)))
    with pytest.raises(NotFoundException):
        await service.get_single_normalized_product(db, uuid4(), uuid4())
