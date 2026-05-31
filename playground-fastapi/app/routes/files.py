from fastapi import APIRouter, Depends, UploadFile, File, Header, HTTPException, Request
from app.core.dependencies import get_current_user, require_admin, get_db
from app.schemas.file import FileUploadResponse, PDFExtractResponse, FileStatus
from app.services import file_service, csv_extract
from app.models.file import File as FileModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from app.core.rate_limiter import limiter
import uuid

router = APIRouter(prefix="/files",tags=["Files & Upload"])

@router.post("/images",response_model=FileUploadResponse)
@limiter.limit("10/hour")
async def upload_image(
    request: Request,
    file: UploadFile = File(...,description="Image file (JPEG, PNG, WebP, GIF)"),
    current_user=Depends(get_current_user)
):
    """
        Upload a general image. Returns the URL to access it

        The file is:
        1. Validated for allowed MIME types
        2. Checked against max file size
        3. Verified as a real image (magic bytes via Pillow)
        4. Saved with a randomized filename
    """

    return await file_service.upload_image(file)


@router.post('/documents',response_model=FileUploadResponse)
@limiter.limit("10/hour")
async def upload_document(
    request: Request,
    file: UploadFile = File(...,description="Document file (PDF, DOC, DOCX)"),
    current_user=Depends(get_current_user)
):
    """
        Upload a document file. Returns the storage URL
    """
    return await file_service.upload_document(file)

@router.post(
    "/pdf/extract",
    response_model=PDFExtractResponse
)
@limiter.limit("20/hour")
async def extract_pdf(
    request: Request,
    file: UploadFile = File(...,description="PDF file to extract text from"),
    # current_user=Depends(get_current_user)
):
    """
        Upload a PDF and extract all text and tables from every page.

        Returns:
        - Full concatenated text (useful for search indexing or LLM input)
        - Per-page breakdown with text and detected tables 

        Use cases:
    - Product spec sheets → extract specs as structured data
    - Invoices → extract line items
    - Reports → index for search
    - Any document → feed to an AI for summarization
    """
    return await file_service.extract_pdf_content(file)

@router.post(
        "/extract-csv/pipeline",
        # response_model=PDFExtractResponse,
    )
@limiter.limit("20/hour")
async def extract_pdf_pipeline(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await csv_extract.extract_csv_pipeline(current_user,file,db)

@router.post(
    "/pdf/extract-authenticated",
    status_code=202,
    summary="Upload PDF – Background Processing via Inngest"
)
@limiter.limit("10/hour")
async def extract_pdf_authenticated(
    request: Request,
    file: UploadFile = File(..., description="PDF file to extract text from"),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    idempotency_key: str | None = Header(
        None,
        description="Unique identifier for request idempotency."
                    "Same key = cached response, prevents duplicate processing. Optional - if not provided, UUID will be auto-generated"
    ),
):
    """
        Upload a PDF for **background processing** via Inngest.

        🔐 **Authenticated endpoint** – Requires user login

        ### How it works
        1. Validates file type & idempotency key
        2. Uploads raw PDF to S3
        3. Creates a DB record (status = `processing`)
        4. Fires an Inngest event → background worker runs:
           - Virus scan
           - PDF text/table extraction
           - LLM structured data extraction
           - DB update (status → `completed`)

        ### Idempotency Protection
        - Send unique `Idempotency-Key` header with each request
        - Duplicate requests with same key return cached result instantly
        - Prevents double-uploads from network retries or accidental double-clicks

        ### Returns
        - `202 Accepted` with `file_id` and `status: "processing"`
        - Or cached full response if idempotency key was already processed

        ### Example Request Header
        ```
        Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
        ```
    """
    # Auto-generate idempotency key if not provided
    key = idempotency_key or str(uuid.uuid4())

    return await file_service.upload_pdf_authenticated(
        upload=file,
        user_id=current_user.id,
        idempotency_key=key,
        db=db,
        request=request,
    )


@router.get(
    "/pdf/status/{file_id}",
    summary="Poll PDF processing status",
)
async def get_pdf_status(
    file_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
        Poll the processing status of an uploaded PDF.

        ### Response by status
        - `processing` → Still working, poll again in a few seconds
        - `completed`  → Done! Full extraction result included in `result`
        - `failed`     → Error occurred, `error` field has details

        ### Example usage (client-side)
        ```js
        const poll = async (fileId) => {
            const res = await fetch(`/api/v1/files/pdf/status/${fileId}`);
            const data = await res.json();
            if (data.status === "processing") {
                setTimeout(() => poll(fileId), 3000); // retry in 3s
            } else {
                console.log(data.result); // full extraction
            }
        }
        ```
    """
    return await file_service.llm_response_status_result(file_id, current_user.id, db)
