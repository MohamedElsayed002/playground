import logging 
from contextlib import asynccontextmanager

from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.exceptions.handlers import register_exception_handlers
from app.routes import auth, users, products, orders, files
from app.db.session import create_all_tables


logging.basicConfig(
    level=logging.DEBUG if settings.APP_DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Code before `yield` runs at startup.
    Code after `yield` runs at shutdown.
    """
    logger.info(f"🚀 Starting {settings.APP_NAME} [{settings.APP_ENV}]")

    # Create DB tables if they don't exist.
    # In production: use `alembic upgrade head` instead of this.
    if not settings.is_production:
        await create_all_tables()
        logger.info("✅ Database tables ready")

    yield  # ← App is running here

    # Shutdown cleanup
    logger.info("👋 Shutting down...")


# ── App Instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="""
## FastAPI E-Commerce API

A full-featured e-commerce backend demonstrating FastAPI best practices.

### Features
- 🔐 JWT Authentication (access + refresh tokens)
- 👥 User management with role-based access control
- 📦 Products with categories, images, and inventory
- 🛒 Orders with stock management and status tracking
- 📁 File uploads (images, documents)
- 📄 PDF text & table extraction
- 📖 Auto-generated OpenAPI docs (this page!)
    """,
    docs_url="/docs",         # Swagger UI  → http://localhost:8000/docs
    redoc_url="/redoc",       # ReDoc UI    → http://localhost:8000/redoc
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ── Middleware Registration ────────────────────────────────────────────────────
# ORDER MATTERS: middleware runs in reverse registration order (last added = first to run).

# CORS — must be added early (before other middleware that might short-circuit)
# NestJS equivalent → app.enableCors({ origin: [...] })
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,    # Required for cookies/auth headers
    allow_methods=["*"],       # Allow all HTTP methods
    allow_headers=["*"],       # Allow all headers
)

# Custom middleware (order: SecurityHeaders runs first, then Logging)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


# ── Exception Handlers ────────────────────────────────────────────────────────
register_exception_handlers(app)


# ── Static Files ───────────────────────────────────────────────────────────────
# Serve uploaded files via HTTP. Files saved to /uploads/images/foo.jpg
# will be accessible at http://localhost:8000/static/images/foo.jpg
# NestJS equivalent → ServeStaticModule
app.mount(
    "/static",
    StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False),
    name="static",
)


# ── Routers (Route Groups) ────────────────────────────────────────────────────
# All routes are prefixed with /api/v1 for versioning.
# NestJS equivalent → app.setGlobalPrefix('api/v1') + registering modules
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(files.router, prefix=API_PREFIX)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Simple health check endpoint.
    Used by load balancers / container orchestrators (Docker, k8s) to check app status.
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


# ── Run directly with: python -m app.main ────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_DEBUG,  # Auto-reload on file changes (like nodemon)
        log_level="debug" if settings.APP_DEBUG else "info",
    )
