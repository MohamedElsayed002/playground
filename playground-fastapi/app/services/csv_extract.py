from datetime import datetime, timedelta, timezone
import logging 

from fastapi import UploadFile, HTTPException, Request 
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.exceptions.handlers import UnprocessableFileException
import boto3 
from sqlalchemy import select 

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.idempotency import IdempotencyKey
import inngest
from app.services.audit_service import create_audit_log 
from app.models.idempotency import IdempotencyKey
import json

from app.services.file_service import _read_upload_chunks, _safe_filename
from app.models.report_jobs import ReportJob, JobStatus

logger = logging.getLogger(__name__)


s3 = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)
BUCKET_NAME = settings.BUCKET_NAME

CSV_MIME_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
    "application/octet-stream",
}


def _is_csv_file(file: UploadFile) -> bool:
    filename = (file.filename or "").lower()
    if filename.endswith(".csv"):
        return True

    content_type = (file.content_type or "").lower()
    return content_type in CSV_MIME_TYPES


async def extract_csv_pipeline(
        # current_user,
        file: UploadFile,
        db: AsyncSession,
        idempotency_key: str
):
        from app.services.inngest import inngest_client

        request_path = "/extract-csv/pipeline"

        # Check if the idempotency key already exists in the database
        result = await db.execute(
                select(IdempotencyKey).where(
                        IdempotencyKey.key == idempotency_key,
                        IdempotencyKey.request_path == request_path,
                )
        )

        existing_key = result.scalar_one_or_none()
        if existing_key and existing_key.response_body is not None:
                await create_audit_log(
                        db=None,
                        # user_id=current_user.id,
                        user_id=1,
                        event="CSV_UPLOADED_IDEMPOTENCY_KEY_EXISTS",
                        status="SUCCESS",
                )
                response_payload = json.loads(existing_key.response_body)
                response_payload["message"] = "Extracted the CSV Successfully go and see it"
                response_payload["success"] = True
                return response_payload

        if existing_key is not None:
                return JSONResponse(
                        status_code=202,
                        content={
                                "success": True,
                                "status": "processing",
                                "message": "This upload is already being processed. Please wait for completion.",
                                "idempotency_key": idempotency_key,
                        },
                )
        
        if existing_key is None:
                # Create a new idempotency key record
                expires_at = datetime.now(timezone.utc) + timedelta(
                        hours=settings.IDEMPOTENCY_KEY_TTL_HOURS
                )

                new_key = IdempotencyKey(
                        key=idempotency_key,
                        user_id=1,
                        request_path=request_path,
                        expires_at=expires_at,
                )

                db.add(new_key)
                await db.commit()



        # Validate the extension / MIME type
        if not _is_csv_file(file):
            raise UnprocessableFileException(
                f"Unsupported file type: {file.content_type or 'unknown'}. Only CSV files are allowed."
            )

        max_bytes = settings.max_file_size_bytes

        if file.size is not None and file.size > max_bytes:
            raise HTTPException(status_code=413, detail="File exceeds the maximum upload size.")

        # Upload the file S3 Bucket
        file_bytes = await _read_upload_chunks(file, max_bytes)

        safe_filename = _safe_filename(file.filename or "document.csv")

        s3_key = f"csv/{safe_filename}"

        s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType=file.content_type or "text/csv",
        )

        url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

        # Save to DB
        job =   ReportJob(
                user_id=1,
                file_url=url,
                original_filename=file.filename,
                file_s3_key=s3_key,
                status=JobStatus.QUEUED,
                current_step="uploaded",
                progress=5
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)


        await create_audit_log(
                db=None,
                user_id=1,
                event="CSV_UPLOADED_SUCCESSFULLY",
                status="SUCCESS",
        )

        event_payload = {
                "job_id": str(job.id),
                "idempotency_key": idempotency_key,
        }

        # Background jobs
        await inngest_client.send(
                inngest.Event(
                        name="csv/uploaded.requested",
                        data=event_payload,
                )
        )
 

        return {
                "success": True,
                "job_id": str(job.id),
                "status": job.status.value,
                "file_name": job.original_filename,
                "current_step": job.current_step,
        }