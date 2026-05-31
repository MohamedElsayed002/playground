import csv
import io 
from uuid import UUID
# npx inngest-cli@latest dev -p 8288

import inngest 

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.report_jobs import JobStatus, ReportJob
from app.services.csv_extract import BUCKET_NAME, s3
from app.services.inngest.client import inngest_client, logger 
from datetime import datetime


REQUIRED_COLUMNS = [
    "product_id",
    "product_name",
    "category",
    "price",
    "quantity",
    "last_restock_date",
]

def load_csv_from_s3(s3_key: str) -> str:
    response = s3.get_object(
        Bucket=BUCKET_NAME,
        Key=s3_key
    )

    raw_bytes = response["Body"].read()

    return raw_bytes.decode("utf-8",errors="replace")


def is_valid_date(value: str) -> bool:
    try:
        date = datetime.strptime(value,"%Y-%m-%d")
        today = datetime.utcnow()

        if date > today:
            return False

        if date.year < 2000:
            return False

        return True
    except (ValueError, TypeError):
        return False

@inngest_client.create_function(
    fn_id="process-csv-upload",
    trigger=inngest.TriggerEvent(event="csv/uploaded.requested"),
    retries=3
)
async def process_csv_upload(ctx: inngest.Context):
    step = ctx.step 
    data = ctx.event.data
    job_id = data["job_id"]



    # Step 1 Get Job + S3 Key 
    async def get_job():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(ReportJob).where(ReportJob.id == UUID(job_id))
            )
        
            job = result.scalars().first()

            if not job:
                raise ValueError(f"Job {job_id} not found")

            return {
                "job_id": str(job.id),
                "s3_key": job.file_s3_key
            }
        
    job_data = await step.run("get-job",get_job)

    s3_key = job_data["s3_key"]
    # Step 2 Mark Processing

    async def mark_processing():

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(ReportJob).where(ReportJob.id == UUID(job_id))
            )

            job = result.scalar_one()

            job.status = JobStatus.PROCESSING
            job.current_step = "processing"
            job.progress = 10
            
            await db.commit()
            return True
        
    await step.run("mark-processing",mark_processing)

    # Step 3: Parse CSV
    async def parse_csv():

        raw_text = load_csv_from_s3(s3_key)

        reader = csv.DictReader(
            io.StringIO(raw_text)
        )

        row_count = 0

        for _ in reader:
            row_count+=1
        
        return {
            "row_count": row_count
        }

    csv_result = await step.run("parse-csv",parse_csv)


    # Step 4: Validate CSV
    async def validate_csv():
        raw_text = load_csv_from_s3(s3_key)

        reader = csv.DictReader(
            io.StringIO(raw_text)
        )

        headers = reader.fieldnames or []

        missing_columns = [
            column
            for column in REQUIRED_COLUMNS
            if column not in headers
        ]

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
            total_rows+=1
            has_product_id = bool(row.get("product_id"))
            has_product_name = bool(row.get("product_name"))

            try:
                price = float(row.get("price",0))
                price_is_positive = price > 0

                if not price_is_positive:
                    invalid_price += 1

            except (ValueError, TypeError):
                invalid_price+=1
                price_is_positive = False
            
            try:
                quantity = int(row.get("quantity",0))
                quantity_is_positive = quantity >= 0

                if not quantity_is_positive:
                    invalid_quantity+=1
                
            except (ValueError,TypeError):
                invalid_quantity+=1
                quantity_is_positive = False


            valid_date = is_valid_date(row.get("last_restock_date"))

            if not valid_date:
                invalid_dates+=1

            if(
                has_product_id and
                has_product_name and
                price_is_positive and 
                quantity_is_positive and 
                valid_date
            ):
                valid_rows+=1
            else:
                invalid_rows+=1
        

        quality_score = round(
            (valid_rows / total_rows) * 100,
            2
        ) if total_rows else 0

        return {
            "headers": headers,
            "missing_columns": missing_columns,
            "total_rows": total_rows,
            "valid_rows": valid_rows,
            "quality_score": quality_score,
            "invalid_rows": invalid_rows,
            "invalid_price": invalid_price,
            "invalid_quantity": invalid_quantity,
            "invalid_dates": invalid_dates
        }

    validation_result = await step.run("validate-csv",validate_csv)

    # Step 5: Save Validation result
    async def save_validation():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))

            job = result.scalar_one()

            job.total_rows = validation_result["total_rows"]
            job.valid_rows = validation_result["valid_rows"]
            job.invalid_rows = validation_result["invalid_rows"]
            job.invalid_price = validation_result["invalid_price"]
            job.invalid_quantity = validation_result["invalid_quantity"]
            job.invalid_dates = validation_result["invalid_dates"]
            job.quality_score = validation_result["quality_score"]

            job.progress = 70
            job.current_step = "validated"

            if validation_result["missing_columns"]:
                job.status = JobStatus.FAILED
                job.failure_reason = (
                    "Missing required columns: " + ", ".join(validation_result["missing_columns"])
                )
            if validation_result["quality_score"] < 60:
                job.status = JobStatus.FAILED
                job.failure_reason = (
                    f"Data quality too low ({validation_result['quality_score']}%)"
                )
            else:
                job.status = JobStatus.PROCESSING
            
            await db.commit()
            return True
    
    await step.run("save-validation",save_validation)

    # Step 6: Complete Job
    
    async def complete_job():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(ReportJob).where(ReportJob.id == UUID(job_id))
            )

            job = result.scalar_one()

            if job.status == JobStatus.FAILED:
                return False 
            job.status = JobStatus.COMPLETED
            job.current_step = "completed"
            job.progress = 100
            await db.commit()
            return True
    
    await step.run("complete-job",complete_job)




    return {
        "status": "completed",
        "job_id": job_id,
        "s3_key": s3_key,
        "rows_found": csv_result["row_count"],
        "validation": validation_result,
    }
