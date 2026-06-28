import csv
import io
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import delete, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.normalized_products import NormalizedProduct

REQUIRED_COLUMNS = [
    "product_id",
    "product_name",
    "category",
    "price",
    "quantity",
    "last_restock_date",
]
MIN_QUALITY_SCORE = 60


def is_valid_date(value: str | None) -> bool:
    try:
        date = datetime.strptime(value or "", "%Y-%m-%d")
        today = datetime.utcnow()

        if date > today:
            return False

        if date.year < 2000:
            return False

        return True
    except (ValueError, TypeError):
        return False


def normalize_date(value: str | None) -> str:
    if not value:
        return ""
    
    formats = [
        "%Y-%m-%d",  # 2025-05-01
        "%d/%m/%Y",  # 01/05/2025
        "%m/%d/%Y",  # 5/1/2025
        "%Y/%m/%d"   # 2025/05/01
    ]
    
    for fmt in formats:
        try:
            parsed = datetime.strptime(value.strip(), fmt)
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    # If nothing matches, return original for debugging
    return value



def validate_csv_text(raw_text: str) -> dict[str, Any]:
    reader = csv.DictReader(io.StringIO(raw_text))
    headers = reader.fieldnames or []

    missing_columns = [column for column in REQUIRED_COLUMNS if column not in headers]

    if missing_columns:
        return {
            "headers": headers,
            "missing_columns": missing_columns,
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "invalid_price": 0,
            "invalid_quantity": 0,
            "invalid_dates": 0,
        }

    total_rows = 0
    valid_rows = 0
    invalid_rows = 0
    invalid_price = 0
    invalid_quantity = 0
    invalid_dates = 0

    for row in reader:
        total_rows += 1
        has_product_id = bool(row.get("product_id"))
        has_product_name = bool(row.get("product_name"))

        try:
            price = float(row.get("price", 0))
            price_is_positive = price > 0
            if not price_is_positive:
                invalid_price += 1
        except (ValueError, TypeError):
            invalid_price += 1
            price_is_positive = False

        try:
            quantity = int(row.get("quantity", 0))
            quantity_is_positive = quantity >= 0
            if not quantity_is_positive:
                invalid_quantity += 1
        except (ValueError, TypeError):
            invalid_quantity += 1
            quantity_is_positive = False

        valid_date = is_valid_date(row.get("last_restock_date"))
        if not valid_date:
            invalid_dates += 1

        if (
            has_product_id
            and has_product_name
            and price_is_positive
            and quantity_is_positive
            and valid_date
        ):
            valid_rows += 1
        else:
            invalid_rows += 1

    quality_score = round((valid_rows / total_rows) * 100, 2) if total_rows else 0

    return {
        "headers": headers,
        "missing_columns": missing_columns,
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "quality_score": quality_score,
        "invalid_rows": invalid_rows,
        "invalid_price": invalid_price,
        "invalid_quantity": invalid_quantity,
        "invalid_dates": invalid_dates,
    }


def normalize_csv_text(raw_text: str, job_id: str, bucket_name: str, storage_client: Any) -> dict[str, Any]:
    reader = csv.DictReader(io.StringIO(raw_text))
    normalized_rows = []
    normalization_changes_count = 0

    for row in reader:
        raw_category = (row.get("category") or "").strip()
        raw_product_name = (row.get("product_name") or "").strip()
        raw_price = (row.get("price") or "").strip()
        raw_quantity = (row.get("quantity") or "").strip()
        raw_date = (row.get("last_restock_date") or "").strip()

        category = raw_category.title()
        product_name = raw_product_name.title()

        try:
            price = max(float(raw_price or 0), 0)
        except Exception:
            price = 0.0

        try:
            quantity = max(int(raw_quantity or 0), 0)
        except Exception:
            quantity = 0

        normalized_date = normalize_date(raw_date)

        if category != raw_category or product_name != raw_product_name or str(price) != raw_price or str(quantity) != raw_quantity or normalized_date != raw_date:
            normalization_changes_count += 1

        normalized_rows.append(
            {
                "product_id": row.get("product_id"),
                "product_name": product_name,
                "category": category,
                "price": price,
                "quantity": quantity,
                "last_restock_date": normalized_date,
            }
        )

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=REQUIRED_COLUMNS)
    writer.writeheader()
    writer.writerows(normalized_rows)

    normalized_csv = output.getvalue()
    normalized_s3_key = f"normalized/{job_id}.csv"

    storage_client.put_object(
        Bucket=bucket_name,
        Key=normalized_s3_key,
        Body=normalized_csv.encode("utf-8"),
        ContentType="text/csv",
        CacheControl="max-age=3600",
    )

    normalized_file_url = f"https://{bucket_name}.s3.amazonaws.com/{normalized_s3_key}"

    return {
        "rows_count": len(normalized_rows),
        "normalized_file_url": normalized_file_url,
        "normalized_s3_key": normalized_s3_key,
        "normalization_changes_count": normalization_changes_count,
    }


INGEST_BATCH_SIZE = 1000


def is_ingestible_row(row: dict[str, str | None]) -> bool:
    has_product_id = bool((row.get("product_id") or "").strip())
    has_product_name = bool((row.get("product_name") or "").strip())

    try:
        price = float(row.get("price") or 0)
        price_is_valid = price > 0
    except (ValueError, TypeError):
        price_is_valid = False

    try:
        quantity = int(float(row.get("quantity") or 0))
        quantity_is_valid = quantity >= 0
    except (ValueError, TypeError):
        quantity_is_valid = False

    date_is_valid = is_valid_date(row.get("last_restock_date"))

    return (
        has_product_id
        and has_product_name
        and price_is_valid
        and quantity_is_valid
        and date_is_valid
    )


def _parse_restock_date(value: str | None) -> date | None:
    if not value or not value.strip():
        return None
    stripped = value.strip()
    if not is_valid_date(stripped):
        return None
    return datetime.strptime(stripped, "%Y-%m-%d").date()


async def ingest_normalized_csv(
    raw_text: str,
    job_id: uuid.UUID,
    session: AsyncSession,
    *,
    batch_size: int = INGEST_BATCH_SIZE,
) -> dict[str, Any]:
    batch: list[dict[str, Any]] = []
    ingested_rows = 0
    skipped_rows = 0

    try:
        async with session.begin():
            await session.execute(
                delete(NormalizedProduct).where(NormalizedProduct.job_id == job_id)
            )

            reader = csv.DictReader(io.StringIO(raw_text))

            for row in reader:
                if not is_ingestible_row(row):
                    skipped_rows += 1
                    continue

                batch.append(
                    {
                        "job_id": job_id,
                        "product_id": (row.get("product_id") or "").strip(),
                        "product_name": (row.get("product_name") or "").strip(),
                        "category": (row.get("category") or "").strip() or None,
                        "price": float(row.get("price") or 0),
                        "quantity": int(float(row.get("quantity") or 0)),
                        "last_restock_date": _parse_restock_date(row.get("last_restock_date")),
                    }
                )

                if len(batch) >= batch_size:
                    await session.execute(insert(NormalizedProduct), batch)
                    ingested_rows += len(batch)
                    batch.clear()

            if batch:
                await session.execute(insert(NormalizedProduct), batch)
                ingested_rows += len(batch)
    except Exception:
        raise

    return {"inserted": True, "ingested_rows": ingested_rows, "skipped_rows": skipped_rows}
