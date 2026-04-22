from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_user, require_admin 
from app.schemas.file import FileUploadResponse, PDFExtractResponse 
from app.services import file_service

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
    current_user=Depends(get_current_user)
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