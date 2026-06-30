from app.models.normalized_products import NormalizedProduct
from app.models.report_jobs import ReportJob
import logging
from uuid import UUID
from app.services.audit_service import create_audit_log
from sqlalchemy import select, delete, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import load_only, noload
from app.exceptions.handlers import BadRequestException, NotFoundException

logger = logging.getLogger(__name__)



async def get_all_report_jobs(
        session: AsyncSession,
        current_user: int = 1,
        limit: int = 10,
        offset: int = 0
        ) -> list[ReportJob]:
    filters = [ReportJob.user_id == 1]

    count_result = await session.execute(
        select(func.count()).select_from(ReportJob).where(*filters)
    )
    total_jobs = count_result.scalar_one()

    result = await session.execute(
        select(ReportJob)
        .options(
            load_only(
                ReportJob.id,
                ReportJob.user_id,
                ReportJob.created_at,
                ReportJob.original_filename,
                ReportJob.status,
                ReportJob.current_step,
                ReportJob.progress,
                ReportJob.total_rows,
                ReportJob.valid_rows,
                ReportJob.invalid_rows,
                ReportJob.invalid_price,
                ReportJob.invalid_quantity,
                ReportJob.invalid_dates,
                ReportJob.ingested_rows,
                ReportJob.ingestion_status,
                ReportJob.failure_reason
            ),
            noload(ReportJob.user)
        )
        .where(*filters)
        .order_by(ReportJob.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    jobs = result.scalars().all()

    return {
        "total_jobs": total_jobs,
        "jobs": jobs
    }


async def get_status_report_job(
        session: AsyncSession,
        report_id: UUID
):
    result = await session.execute(
        select(ReportJob).where(ReportJob.id == report_id)
    )

    report = result.scalar_one_or_none()

    if not report:
        raise NotFoundException("Report id not found", report_id)
    
    return report
    
async def get_normalized_products(
        session: AsyncSession,
        job_id: UUID,
        *,
        limit: int = 10,
        offset: int = 0,
        product_name: str | None = None,
        category: str | None = None,
        sort_by: str = "price",
        sort_order: str = "asc",
    ) -> dict:
    filters = [NormalizedProduct.job_id == job_id]

    if product_name:
        filters.append(NormalizedProduct.product_name.ilike(f"%{product_name}%"))

    if category:
        filters.append(NormalizedProduct.category.ilike(f"%{category}%"))

    count_result = await session.execute(
        select(func.count()).select_from(NormalizedProduct).where(*filters)
    )
    total = count_result.scalar_one()

    query = select(NormalizedProduct).where(*filters)

    if sort_by == "price":
        order_column = NormalizedProduct.price
    elif sort_by == "product_name":
        order_column = NormalizedProduct.product_name
    elif sort_by == "category":
        order_column = NormalizedProduct.category
    else:
        order_column = NormalizedProduct.price

    query = query.order_by(order_column.asc() if sort_order.lower() == "asc" else order_column.desc())
    query = query.limit(limit).offset(offset)

    result = await session.execute(query)
    products = result.scalars().all()

    return {
        "total": total,
        "products": products,
    }


async def create_normalized_product(
        session: AsyncSession,
        job_id: UUID,
        data: dict,
) -> NormalizedProduct:
    required_fields = ["product_id", "product_name", "price", "quantity"]
    missing_fields = [field for field in required_fields if field not in data or data[field] in (None, "")]

    if missing_fields:
        raise BadRequestException("Missing required fields: " + ", ".join(missing_fields))

    job_result = await session.execute(select(ReportJob).where(ReportJob.id == job_id))
    job = job_result.scalar_one_or_none()

    if not job:
        raise NotFoundException("ReportJob", job_id)

    product = NormalizedProduct(
        job_id=job_id,
        product_id=str(data["product_id"]).strip(),
        product_name=str(data["product_name"]).strip(),
        category=(str(data["category"]).strip() if data.get("category") not in (None, "") else None),
        price=data["price"],
        quantity=int(data["quantity"]),
        last_restock_date=data.get("last_restock_date"),
    )

    session.add(product)

    await create_audit_log(
        db=session,
        user_id=1,
        event="NORMALIZED_PRODUCT_CREATED",
        status="SUCCESS",
        metadata={
            "details": f"Product {product.product_id} created for job {job_id}.",
        },
    )

    await session.commit()
    await session.refresh(product)

    return product


async def get_single_normalized_product(
        session: AsyncSession,
        product_id: UUID,
        job_id: UUID,
) -> NormalizedProduct:
    result = await session.execute(
        select(NormalizedProduct)
        .where(NormalizedProduct.id == product_id)
        .where(NormalizedProduct.job_id == job_id)
        .limit(1)
    )

    product = result.scalar_one_or_none()

    if not product:
        raise NotFoundException("NormalizedProduct", product_id)
    
    return product


async def update_normalized_product(
        session: AsyncSession,
        product_id: UUID,
        job_id: UUID,
        data: dict
) -> NormalizedProduct:
    
    result = await session.execute(
        select(NormalizedProduct)
        .where(NormalizedProduct.id == product_id)
        .where(NormalizedProduct.job_id == job_id)
        .limit(1)
        .with_for_update()
    )

    product = result.scalar_one_or_none()

    if not product:
        raise NotFoundException("NormalizedProduct", product_id)
    
    for field, value in data.items():
        setattr(product, field, value)

    await create_audit_log(
        db=session,
        user_id=1,
        event="NORMALIZED_PRODUCT_UPDATED",
        status="SUCCESS",
        metadata={
            "details": f"Product {product_id} from job {job_id} updated successfully."
        },
    )

    await session.commit()
    await session.refresh(product)

    return product

async def delete_normalized_product(
        session: AsyncSession,
        product_id: UUID,
        job_id: UUID
):
    result = await session.execute(
        select(NormalizedProduct)
        .where(NormalizedProduct.id == product_id)
        .where(NormalizedProduct.job_id == job_id)
        .limit(1)
    )

    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("NormalizedProduct", product_id)
    
    await create_audit_log(
        db=session,
        user_id=1,
        event="NORMALIZED_PRODUCT_DELETED",
        status="SUCCESS",
        metadata={
            "details": f"Product {product_id} from job {job_id} deleted successfully."
        },
    )

    await session.delete(product)
    await session.commit()
    
    return True
