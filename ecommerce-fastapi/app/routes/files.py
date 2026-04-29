from fastapi import APIRouter, Depends, UploadFile, File, Header
from app.core.dependencies import get_current_user, require_admin, get_db
from app.schemas.file import FileUploadResponse, PDFExtractResponse 
from app.services import file_service
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

router = APIRouter(prefix="/files",tags=["Files & Upload"])

@router.post("/images",response_model=FileUploadResponse)
async def upload_image(
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
async def upload_document(
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
async def extract_pdf(
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
    "/pdf/extract-authenticated",
    response_model=PDFExtractResponse,
    summary="Upload PDF with Idempotency Protection"
)
async def extract_pdf_authenticated(
    file: UploadFile = File(..., description="PDF file to extract text from"),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    idempotency_key: str | None = Header(
        None,
        description="Unique identifier for request idempotency (UUID v4 recommended). "
                    "Same key = cached response, prevents duplicate processing. Optional - if not provided, UUID will be auto-generated"
    ),
):
    """
        Upload a PDF and extract all text and tables with **IDEMPOTENCY protection**.
        
        🔐 **Authenticated endpoint** - Requires user login
        
        ### Idempotency Protection
        - Send unique `Idempotency-Key` header with each request
        - Duplicate requests with same key return cached result instantly
        - Prevents double-uploads from network retries or accidental double-clicks
        
        ### Database Integration
        - Saves file metadata with unique constraint per user per filename
        - Caches response in IdempotencyKey table
        - Returns same result for retries without reprocessing
        
        ### Returns
        - Full concatenated PDF text
        - Per-page breakdown with text and tables
        - Structured data (if extraction available)
        
        ### Example Request Header
        ```
        Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
        ```
        
        ### Use Cases
        - Resume uploads (with duplicate prevention)
        - Invoice processing (audit trail)
        - Document archive (immutable history)
        - LLM pipeline (deduplicated input)
    """
    # Auto-generate idempotency key if not provided
    key = idempotency_key or str(uuid.uuid4())
    
    return await file_service.upload_pdf_authenticated(
        upload=file,
        user_id=current_user.id,
        idempotency_key=key,
        db=db,
    )