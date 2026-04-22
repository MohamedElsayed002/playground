"""
app/core/middleware.py

Custom middleware for the FastAPI application 

NestJS equivalent -> Middleware / Inerceptors
FastAPI approach -> Starletter BaseHTTPMiddleware

Middleware runs on EVERY request before it hits your route hamdler,
and on EVERY response before it goes back to the client
"""

import time 
import uuid 
import logging 

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
        Logs every incoming request and outgoing response with:
        - A unique request ID (great for tracing in logs)
        - HTTP method + path 
        - Response status code 
        - Processing time in milliseconds
    
    This is the FastAPI equivalent of NestJS's LoggingInterceptor
    """

    async def dispatch(self,request: Request, call_next) -> Response:

        # Generate a unique ID for this request (helps trace logs)
        request_id = str(uuid.uuid4())[:8]

        # Attach request_id to request state so routes can access it
        request.state.request_id = request_id

        start_time = time.perf_counter()

        # Log the incoming request 
        logger.info(
            f"[{request_id}] → {request.method} {request.url.path}"
        )

        # Call the actual route handler 
        response = await call_next(request)

        # Calculate duration 
        duration_ms = (time.perf_counter() - start_time) * 1000 

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Add the request ID to the response headers (useful for debugging)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"

        # Log the outgoing response
        logger.info(
            f"[{request_id}] ← {response.status_code} ({duration_ms:.2f}ms)"
        )

        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
        Adds security-related HTTP headers to every response.
        These are basic best practices for any web API
    """

    async def dispatch(self,request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent browsers from sniffing the content type
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Enable XSS protection in older browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"

        return response
