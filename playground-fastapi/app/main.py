import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.exceptions.handlers import register_exception_handlers
from app.routes import auth, users, products, orders, files, audit_logs
from app.db.session import create_all_tables

# Rate Limiting


import inngest.fast_api

from app.services.inngest import inngest_client, inngest_functions


# Logging
logging.basicConfig(
    level=logging.DEBUG if settings.APP_DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.rate_limiter import limiter

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} [{settings.APP_ENV}]")

    if not settings.is_production:
        await create_all_tables()
        logger.info("Database tables ready")

    yield

    logger.info("Shutting down...")


# App
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://playground-lilac-nine.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Inngest
inngest.fast_api.serve(app, inngest_client, inngest_functions)


# Custom Middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


# Exception handlers
register_exception_handlers(app)



app.mount(
    "/static",
    StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False),
    name="static",
)



API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(files.router, prefix=API_PREFIX)
app.include_router(audit_logs.router, prefix=API_PREFIX)



@app.get("/health")
async def health_check():
    return {"status": "healthy"}