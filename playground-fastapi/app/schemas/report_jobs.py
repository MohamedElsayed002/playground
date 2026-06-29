from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal



class Job(BaseModel):
    id: UUID
    user_id: int
    created_at: datetime
    original_filename: str 
    status: str
    current_step: Optional[str]
    progress: int
    total_rows: int
    valid_rows: int
    invalid_rows: int
    invalid_price: int
    invalid_quantity: int
    invalid_dates: int
    ingested_rows: int
    ingestion_status: str
    failure_reason: Optional[str]

    model_config = {"from_attributes": True}


class ReportJobListResponse(BaseModel):
    total_jobs: int
    jobs: List[Job]


class ProductReportListResponse(BaseModel):
    total: int
    products: List["ProductReportResponse"]


class ProductReportResponse(BaseModel):
    id: UUID
    job_id: UUID
    product_id: str
    product_name: str
    category: str | None = None
    price: Decimal
    quantity: int
    last_restock_date: date | None = None


