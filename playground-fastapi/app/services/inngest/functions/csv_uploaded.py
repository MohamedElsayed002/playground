import csv
import io 
import json
from uuid import UUID
# npx inngest-cli@latest dev -p 8288

import inngest 

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.idempotency import IdempotencyKey
from app.models.report_jobs import IngestionStatus, JobStatus, ReportJob
from app.services.csv_extract import BUCKET_NAME, s3
from app.services.csv_pipeline import (
    MIN_QUALITY_SCORE,
    REQUIRED_COLUMNS,
    ingest_normalized_csv,
    normalize_csv_text,
    validate_csv_text,
)
from app.services.inngest.client import inngest_client 

async def persist_idempotency_result(idempotency_key: str | None, payload: dict, status_code: int) -> None:
    if not idempotency_key:
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(IdempotencyKey).where(IdempotencyKey.key == idempotency_key)
        )
        record = result.scalar_one_or_none()

        if record is None:
            return

        record.response_body = json.dumps(payload)
        record.response_status_code = status_code
        await db.commit()


def load_csv_from_s3(s3_key: str) -> str:
    response = s3.get_object(
        Bucket=BUCKET_NAME,
        Key=s3_key
    )

    raw_bytes = response["Body"].read()

    return raw_bytes.decode("utf-8",errors="replace")


@inngest_client.create_function(
    fn_id="process-csv-upload",
    trigger=inngest.TriggerEvent(event="csv/uploaded.requested"),
    retries=3
)
async def process_csv_upload(ctx: inngest.Context):
    step = ctx.step
    data = ctx.event.data
    job_id = data["job_id"]
    idempotency_key = data["idempotency_key"]

    try:

        # Step 1
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
                    "s3_key": job.file_s3_key,
                }

        job_data = await step.run("get-job", get_job)
        s3_key = job_data["s3_key"]
        

        # Step 2
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

        await step.run("mark-processing", mark_processing)


        # Step 3
        async def parse_csv():
            raw_text = load_csv_from_s3(s3_key)
            reader = csv.DictReader(io.StringIO(raw_text))
            row_count = 0

            for _ in reader:
                row_count += 1

            async with AsyncSessionLocal() as db:
                result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                job = result.scalar_one()
                job.current_step = "parsed"
                job.progress = 20
                await db.commit()

            return {"row_count": row_count}

        csv_result = await step.run("parse-csv", parse_csv)


        # Step 4
        async def validate_csv():
            raw_text = load_csv_from_s3(s3_key)
            result = validate_csv_text(raw_text)

            async with AsyncSessionLocal() as db:
                job_result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                job = job_result.scalar_one()
                job.current_step = "validated"
                job.progress = 30
                await db.commit()

            return result

        validation_result = await step.run("validate-csv", validate_csv)
        

        # Step 5
        async def normalize_csv():
            raw_text = load_csv_from_s3(s3_key)
            result = normalize_csv_text(raw_text, job_id, BUCKET_NAME, s3)

            async with AsyncSessionLocal() as db:
                job_result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                job = job_result.scalar_one()
                job.current_step = "normalized"
                job.progress = 40
                await db.commit()

            return result
        
        # Step 6
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
                job.progress = 50
                job.current_step = "validated"

                if validation_result["missing_columns"]:
                    job.status = JobStatus.FAILED
                    job.failure_reason = (
                        "Missing required columns: " + ", ".join(validation_result["missing_columns"])
                    )
                elif validation_result["quality_score"] < MIN_QUALITY_SCORE:
                    job.status = JobStatus.FAILED
                    job.failure_reason = (
                        f"Data quality too low ({validation_result['quality_score']}%)"
                    )
                else:
                    job.status = JobStatus.PROCESSING

                await db.commit()
                return {
                    "should_continue": job.status != JobStatus.FAILED,
                    "status": job.status.value,
                    "failure_reason": job.failure_reason,
                }

        validation_save_result = await step.run("save-validation", save_validation)
  

        # Optional Step 7: If validation fails, complete the job as failed and return early
        if not validation_save_result["should_continue"]:
            async def complete_job():
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                    job = result.scalar_one()

                    if job.status == JobStatus.FAILED:
                        return {"completed": False, "status": job.status.value, "failure_reason": job.failure_reason}

                    job.status = JobStatus.COMPLETED
                    job.current_step = "completed"
                    job.progress = 100
                    await db.commit()
                    return {"completed": True, "status": job.status.value}

            complete_result = await step.run("complete-job", complete_job)
            final_payload = {
                "status": "completed" if complete_result.get("completed", True) else "failed",
                "job_id": job_id,
                "s3_key": s3_key,
                "rows_found": csv_result["row_count"],
                "validation": validation_result,
                "normalized_rows_count": 0,
                "failure_reason": complete_result.get("failure_reason"),
            }
            await persist_idempotency_result(idempotency_key, final_payload, 200)
            return final_payload

        normalize_csv_result = await step.run("normalized_csv", normalize_csv)


        # Step 8
        async def save_normalization():
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                job = result.scalar_one()

                job.normalized_file_s3_key = normalize_csv_result["normalized_s3_key"]
                job.normalized_file_url = normalize_csv_result["normalized_file_url"]
                job.normalized_rows_count = normalize_csv_result["rows_count"]
                job.current_step = "normalized"
                job.progress = 60
                job.metadata_json = {
                    **(job.metadata_json or {}),
                    "normalization_changes_count": normalize_csv_result["normalization_changes_count"],
                }

                await db.commit()
                return True

        await step.run("save-normalization", save_normalization)


        # Step 9
        async def ingest_database():
            normalized_s3_key = normalize_csv_result["normalized_s3_key"]
            raw_text = load_csv_from_s3(normalized_s3_key)

            async with AsyncSessionLocal() as db:
                result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                job = result.scalar_one()
                job.ingestion_status = IngestionStatus.PROCESSING
                job.current_step = "ingesting"
                job.progress = 70
                await db.commit()

            try:
                async with AsyncSessionLocal() as db:
                    ingest_result = await ingest_normalized_csv(raw_text, UUID(job_id), db)

                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                    job = result.scalar_one()
                    job.progress = 80
                    await db.commit()

                return ingest_result
            except Exception:
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                    job = result.scalar_one()
                    job.ingestion_status = IngestionStatus.FAILED
                    job.status = JobStatus.FAILED
                    job.failure_reason = "Database ingestion failed"
                    await db.commit()
                raise

        ingest_result = await step.run("ingest-database", ingest_database)


        # Step 10
        async def save_ingestion():
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                job = result.scalar_one()

                job.ingested_rows = ingest_result["ingested_rows"]
                job.ingestion_status = IngestionStatus.COMPLETED
                job.current_step = "ingested"
                job.progress = 90

                await db.commit()
                return True

        await step.run("save-ingestion-result", save_ingestion)


        # Step 10
        async def complete_job():
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(ReportJob).where(ReportJob.id == UUID(job_id)))
                job = result.scalar_one()

                if job.status == JobStatus.FAILED:
                    return {"completed": False, "status": job.status.value, "failure_reason": job.failure_reason}

                job.status = JobStatus.COMPLETED
                job.current_step = "completed"
                job.progress = 100
                await db.commit()
                return {"completed": True, "status": job.status.value}

        complete_result = await step.run("complete-job", complete_job)

        final_payload = {
            "status": "completed" if complete_result.get("completed", True) else "failed",
            "job_id": job_id,
            "s3_key": s3_key,
            "rows_found": csv_result["row_count"],
            "validation": validation_result,
            "normalized_rows_count": normalize_csv_result["rows_count"],
            "normalization_changes_count": normalize_csv_result["normalization_changes_count"],
            "ingested_rows": ingest_result["ingested_rows"],
            "skipped_rows": ingest_result["skipped_rows"],
            "ingestion_status": IngestionStatus.COMPLETED.value,
            "failure_reason": complete_result.get("failure_reason"),
        }

        await persist_idempotency_result(idempotency_key, final_payload, 200)
        return final_payload
    except Exception as exc:
        error_payload = {
            "status": "failed",
            "job_id": job_id,
            "error": str(exc),
        }
        await persist_idempotency_result(idempotency_key, error_payload, 500)
        raise
