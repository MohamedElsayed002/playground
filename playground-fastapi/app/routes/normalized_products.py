from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.dependencies import get_db
from app.schemas.report_jobs import (
    Job,
    ReportJobListResponse,
    ProductReportResponse,
    ProductReportListResponse,
    NormalizedProductCreate,
)   
from app.services.normalized_data_service import (
    get_normalized_products,
    get_all_report_jobs,
    get_single_normalized_product,
    create_normalized_product,
    update_normalized_product,
    delete_normalized_product,
    get_status_report_job 
)
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Normalized Products"])



@router.get(
        "/users/{user_id}/report-jobs",
        response_model=ReportJobListResponse,
    )
async def get_all_report_jobs_endpoint(
    user_id: int,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    # current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all report jobs for the current user
    """
    result = await get_all_report_jobs(db,user_id,limit,offset)
    return result


@router.get(
        "/jobs/{report_id}/status",
        response_model=Job
)
async def get_status_report_endpoint(
    report_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
        Get the status of the report 
    """
    result = await get_status_report_job(db, report_id=report_id)
    return result

@router.get(
        "/jobs/{job_id}/products",
        response_model=ProductReportListResponse
    )
async def get_normalized_products_endpoint(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    product_name: str | None = Query(default=None),
    category: str | None = Query(default=None),
    sort_by: str = Query(default="price", regex="^(price|product_name|category)$"),
    sort_order: str = Query(default="asc", regex="^(asc|desc)$"),
):
    """
    Get normalized products for a specific job ID with optional filtering and sorting.
    """
    return await get_normalized_products(
        db,
        job_id,
        limit=limit,
        offset=offset,
        product_name=product_name,
        category=category,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
        "/jobs/{job_id}/products",
        response_model=ProductReportResponse
    )
async def create_normalized_product_endpoint(
    job_id: UUID,
    normalized_product: NormalizedProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a normalized product for a specific job ID.
    """
    return await create_normalized_product(db, job_id, normalized_product.model_dump())


@router.get(
        "/jobs/{job_id}/products/{product_id}",
        response_model=ProductReportResponse
    )
async def get_single_normalized_product_endpoint(
    job_id: UUID,
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single normalized product by job ID and product ID.
    """
    product = await get_single_normalized_product(db, product_id, job_id)
    return product


@router.put("/jobs/{job_id}/products/{product_id}")
async def update_normalized_product_endpoint(
    job_id: UUID,
    product_id: UUID,
    updated_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a normalized product by job ID and product ID.
    """
    updated_product = await update_normalized_product(db, product_id, job_id, updated_data)
    return updated_product


@router.delete("/jobs/{job_id}/products/{product_id}")
async def delete_normalized_product_endpoint(
    job_id: UUID,
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a normalized product by job ID and product ID.
    """
    await delete_normalized_product(db, product_id, job_id)
    return {"message": f"Product {product_id} from job {job_id} deleted successfully."}
