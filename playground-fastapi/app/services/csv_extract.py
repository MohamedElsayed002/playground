import uuid 
from pathlib import Path 
import logging 

import pdfplumber
from fastapi import UploadFile, HTTPException, Request 
from PIL import Image, UnidentifiedImageError 

from app.core.config import settings
from app.exceptions.handlers import UnprocessableFileException, ServiceUnavailableException
from app.schemas.file import FileUploadResponse, PDFExtractResponse, PDFPageContent
import boto3 
from app.services import file_service
from app.schemas.analysis import CVStructuredData
from sqlalchemy import select 

from sqlalchemy.orm import Session 
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.idempotency import IdempotencyKey
from app.models.file import File 
from app.schemas.file import FileStatus
import inngest
from app.services.audit_service import create_audit_log 

from app.services.file_service import _read_upload_chunks, _safe_filename
from app.models.report_jobs import ReportJob, JobStatus

logger = logging.getLogger(__name__)


s3 = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
BUCKET_NAME = settings.BUCKET_NAME

"""
FLOW 

Client Uploads CSV
        ↓
Frontend Validation 
        ↓
Backend Validation
        ↓
Upload Raw File To S3
        ↓
Create Job Record 
        ↓
Return Job ID Immediately
        ↓
Background Worker Starts
        ↓
Parse CSV
        ↓
Clean Data
        ↓
Generate Analytics
        ↓
AI Analysis
        ↓
Generate PDF
        ↓
Upload PDF to S3
        ↓
Mark Job Completed
        ↓
Frontend Polling Detects Completion
        ↓
User Downloads Report      
"""

"""
PHASE 1:

1. Validate
2. Process in background
3. Save Status 
4. User pools progress
"""

"""
PHASE 2:

Download file from S3 
   ↓
Parse CSV
   ↓
Validate data
   ↓
Clean data
   ↓
Generate Statistics
   ↓
Generate Charts 
   ↓
Ask AI
   ↓
Generate PDF
   ↓
Upload PDF
   ↓
Mark Completed
"""

async def extract_csv_pipeline(
        current_user,
        file: UploadFile,
        db: AsyncSession
):
        from app.services.inngest import inngest_client

        # Validate the extension
        content_type = file.content_type.split("/")[1]

        if content_type != "csv":
                raise UnprocessableFileException(f"This file type not supported {content_type} only upload csv files")

        # Validate Size
        file_size = file.size

        if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                raise HTTPException(status_code=413, detail="exceed the file size. only upload 10MB")
                
        # Upload the file S3 Bucket 
        file_bytes = await _read_upload_chunks(file, settings.MAX_FILE_SIZE_MB * 1024 * 1024)

        safe_filename= _safe_filename(file.filename or "document.csv")
        
        s3_key = f"csv/{safe_filename}"

        s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type
        )

        url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

        # Save to DB
        job =   ReportJob(
                user_id=current_user.id,
                file_url=url,
                original_filename=file.filename,
                file_s3_key=s3_key,
                status=JobStatus.QUEUED,
                current_step="uploaded",
                progress=0
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)


        await create_audit_log(
                db=None,
                user_id=current_user.id,
                event="CSV_UPLOADED_SUCCESSFULLY",
                status="SUCCESS",
        )

        event_payload = {
                "job_id": str(job.id)
        }

        # Background jobs
        await inngest_client.send(
                inngest.Event(
                        name="csv/uploaded.requested",
                        data=event_payload,
                )
        )
 

        return {
                "job_id": str(job.id),
                "status": job.status,
                "file_name": job.original_filename,
                "current_step": job.current_step
        }