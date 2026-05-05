import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.exceptions.handlers import register_exception_handlers
from app.routes import auth, users, products, orders, files, audit_logs
from app.db.session import create_all_tables

import inngest.fast_api

# ✅ import from service (IMPORTANT)
from app.services.inngest import inngest_client, inngest_functions

origins = ["https://playground-lilac-nine.vercel.app"]


logging.basicConfig(
    level=logging.DEBUG if settings.APP_DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Starting {settings.APP_NAME} [{settings.APP_ENV}]")

    if not settings.is_production:
        await create_all_tables()
        logger.info("✅ Database tables ready")

    yield

    logger.info("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Mount Inngest endpoint
inngest.fast_api.serve(app, inngest_client, inngest_functions)


# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


# Exceptions
register_exception_handlers(app)


# Static files
app.mount(
    "/static",
    StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False),
    name="static",
)


# Routers
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