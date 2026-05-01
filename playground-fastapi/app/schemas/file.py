from pydantic import BaseModel
from typing import Optional
from app.schemas.analysis import CVStructuredData
from enum import Enum

class FileUploadResponse(BaseModel):
    filename: str 
    original_name: str 
    url: str 
    size_bytes: int
    content_type: str
    
class FileStatus(str,Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class PDFPageContent(BaseModel):
    page_number: int
    text: str 
    tables: list[list[list[str | None]]] = []  # list of tables, each table = list of rows

class PDFExtractResponse(BaseModel):
    filename: str 
    total_pages: int 
    pages: list[PDFPageContent]
    full_text: str
    structured_data: Optional[CVStructuredData] = None