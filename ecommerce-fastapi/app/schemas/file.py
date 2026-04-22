from pydantic import BaseModel

class FileUploadResponse(BaseModel):
    filename: str 
    original_name: str 
    url: str 
    size_bytes: int
    content_type: str

class PDFPageContent(BaseModel):
    page_number: int
    text: str 
    tables: list[list[list[str | None]]] = []  # list of tables, each table = list of rows

class PDFExtractResponse(BaseModel):
    filename: str 
    total_pages: int 
    pages: list[PDFPageContent]
    full_text: str