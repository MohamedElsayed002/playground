"""
Custom exception classes + global exception handlers register in main.py

NestJS equivalent -> Custom exceptions extenting HttpException +
    @Catch() ExceptionFilter + APP_FITER provider

FastAPI approach -> Custom Exceptions class + @app.exception_handler(ExceptionClass)

This gives us:
    1. Consistent JSON error shape across the whole app
    2. Proper HTTP status codes
    3. Request ID in error response (for tracing)
    4. Detailed logging of unexpected errors
"""

import logging 
from fastapi import FastAPI, Request, status 
from fastapi.responses import JSONResponse 
from fastapi.exception_handlers import RequestValidationError 
from sqlalchemy.exc import IntegrityError 

logger = logging.getLogger(__name__)

# Custom Exception classes 

class AppException(Exception):
    """
        Base exception for all app-level erros
        All custom exceptions extend this so we can catch them in one handler
    """

    def __init__(
        self,
        status_code:int,
        detail:str,
        error_code: str | None = None
    ):
        self.status_code = status_code 
        self.detail = detail
        self.error_code = error_code
        super().__init__(detail)


class NotFoundException(AppException):
    """
        404 - resource not found.
    """

    def __init__(self,resource: str = "Resource", id: int | str | None = None):
        detail = f"{resource} not found"
        if id is not None:
            detail = f"{resource} with id '{id} not found'"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,detail=detail,error_code="NOT_FOUND")


class ConflictException(AppException):
    """
        409 - resource already exists
    """

    def __init__(self,detail:str = "Resource already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT,detail=detail,error_code="CONFLICT")
    

class BadRequestException(AppException):
    """
        400 - Bad request (e.g., insufficient stock)
    """
    def __init__(self,detail:str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,detail=detail,error_code="BAD_REQUEST")


class ForbiddenException(AppException):
    """
        403 - user doesn't have permission
    """
    def __init__(self,detail:str="You don't have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN,detail=detail,error_code="FORBIDDEN")

class UnprocessableFileException(AppException):
    """
        422 - Uploaded file is invalid (wrong type, too large, corrupt)
    """
    def __init__(self,detail:str):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,detail=detail,error_code="INVALID_FILE")



# ── Exception Response Builder ────────────────────────────────────────────────

def _error_response(
    request: Request,
    status_code: int,
    message: str,
    error_code: str | None = None,
    errors: list | None = None,
) -> JSONResponse:
    """
    Build a consistent error JSON response shape:
    {
        "success": false,
        "status_code": 404,
        "error_code": "NOT_FOUND",
        "message": "Product with id '99' not found",
        "path": "/api/v1/products/99",
        "request_id": "a1b2c3d4",
        "errors": null       // populated for validation errors
    }
    """
    body = {
        "success": False,
        "status_code": status_code,
        "error_code": error_code or "ERROR",
        "message": message,
        "path": str(request.url.path),
        "request_id": getattr(request.state, "request_id", None),
        "errors": errors,
    }
    return JSONResponse(status_code=status_code, content=body)

# Handler Registration 

def register_exception_handlers(app: FastAPI) -> None:
    """
        Register all exception handlers on the FastAPI app.
        Called once in main.py - like registering ExceptionFilters in NextJS AppModule
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handles all our custom AppException subclasses."""
        return _error_response(
            request,
            status_code=exc.status_code,
            message=exc.detail,
            error_code=exc.error_code,
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """
            Handles Pydantic validation errors (422 Unprocessable Entity)

            FastAPI raises this when the request body/params don't match the schema.
            NestJS equivalent -> Validation throwing BadRequestException with details

            We reformat Pydantic's verbose error list into a cleaner structure
        """

        errors = []

        for error in exc.errors():
            field_path = " → ".join(str(loc) for loc in error["loc"] if loc != "body")

            errors.append({
                "field": field_path or "body",
                "message": error["msg"],
                "type": error["type"]
            })
        
        return _error_response(
            request,
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            message="Validation Error",
            error_code="VALIDATION_ERROR",
            errors=errors
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        """
            Handles SQLAlchemy DB integrity errors (e.g., UNIQUE constraint violation).
            Instead of leaking raw SQL raw SQL errors to the client, we return a clean 409
        """

        logger.warning(f"DB IntegrityError on {request.url.path}: {exc.orig}")

        return _error_response(
            request,
            status_code=status.HTTP_409_CONFLICT,
            message="A record with this data already exists",
            error_code="DUPLICATE_ENTRY"
        )    
    
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        """
            Catch-all for any unexpected exceptions
            Logs the full traceback but returns a generic 500 to the client
            (never leak internal details in production)
        """

        logger.exception(
            f"Unhandled exception on {request.method} {request.url.path}: {exc}"
        )

        return _error_response(
            request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message="An unexpected error occurred. Please try again later",
            error_code="INTERNAL_SERVER_ERROR"
        )