from app.models.normalized_products import NormalizedProduct
from app.models.report_jobs import ReportJob
import logging 
from app.services.audit_service import create_audit_log
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, load_only
from app.exceptions.handlers import BadRequestException

logger = logging.getLogger(__name__)



async def get_all_report_jobs(
        session: AsyncSession,
        current_user: int,
        limit: int = 10,
        offset: int = 0
        ) -> list[ReportJob]:
    result = await session.execute(
        select(ReportJob)
        .options(load_only(ReportJob.id,ReportJob.user_id,ReportJob.created_at))
        .where(ReportJob.user_id == current_user)
        .order_by(ReportJob.created_at.desc()
        ).limit(limit).offset(offset)
    )

    jobs = result.scalars().all()

    return {
        "total_jobs": len(jobs),
        "jobs": jobs
    }


async def get_normalized_products(
        session: AsyncSession,
        job_id: int,
        *,
        limit: int = 10,
        offset: int = 0,
        product_name: str | None = None,
        category: str | None = None,
        sort_by: str = "price",
        sort_order: str = "asc",
    ) -> list[NormalizedProduct]:
    query = select(NormalizedProduct).where(NormalizedProduct.job_id == job_id)

    if product_name:
        query = query.where(NormalizedProduct.product_name.ilike(f"%{product_name}%"))

    if category:
        query = query.where(NormalizedProduct.category.ilike(f"%{category}%"))

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
    return result.scalars().all()


async def get_single_normalized_product(
        session: AsyncSession,
        product_id: int,
        job_id: int,
) -> NormalizedProduct:
    result = await session.execute(
        select(NormalizedProduct).where(NormalizedProduct.id == product_id).where(NormalizedProduct.job_id == job_id)
    )

    product = result.scalar_one_or_none()

    if not product:
        raise BadRequestException(f"Product with ID {product_id} not found for job {job_id}")
    
    return product


async def update_normalized_product(
        session: AsyncSession,
        product_id: int,
        job_id: int,
        data: dict
) -> NormalizedProduct:
    
    result = await session.execute(
        select(NormalizedProduct).where(NormalizedProduct.id == product_id).where(NormalizedProduct.job_id == job_id)
    ).with_for_update()

    product = result.scalar_one_or_none()

    if not product:
        raise BadRequestException(f"Product with ID {product_id} not found for job {job_id}")
    
    for field, value in data.items():
        setattr(product, field, value)

    await session.commit()
    await session.refresh(product)

    await create_audit_log(
        db=session,
        # Allowed for now
        user_id=1,
        event="NORMALIZED_PRODUCT_UPDATED",
        status="SUCCESS",
        details=f"Product {product_id} from job {job_id} updated successfully."
    )

    return product

async def delete_normalized_product(
        session: AsyncSession,
        product_id: int,
        job_id: int
) -> bool:
    result = await session.execute(
        select(NormalizedProduct).where(NormalizedProduct.id == product_id).where(NormalizedProduct.job_id == job_id)
    )

    product = result.scalar_one_or_none()

    if not product:
        raise BadRequestException(f"Product with ID {product_id} not found for job {job_id}")
    
    await session.delete(product)
    await session.commit()

    await create_audit_log(
        db=session,
        user_id=1,
        event="NORMALIZED_PRODUCT_DELETED",
        status="SUCCESS",
        details=f"Product {product_id} from job {job_id} deleted successfully."
    )
    
    return True