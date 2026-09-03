import logging
from contextlib import asynccontextmanager
import os
from urllib.parse import unquote

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.exceptions.handlers import register_exception_handlers
from app.routes import auth, users, products, orders, files, audit_logs, normalized_products
from app.db.session import create_all_tables
# from strawberry.fastapi import GraphQLRouter

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SimpleSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter as OTLPGrpcSpanExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter as OTLPHttpSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.metrics import get_meter
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


# Initialize OpenTelemetry 
trace.set_tracer_provider(
    TracerProvider(resource=Resource.create({"service.name": settings.APP_NAME}))
)
tracer = trace.get_tracer(__name__)

# Configure either local Jaeger gRPC or a managed OTLP/HTTP endpoint.
otel_headers = {
    key.strip(): value.strip()
    for item in settings.OTEL_EXPORTER_OTLP_HEADERS.split(",")
    if item.strip() and "=" in item
    for key, value in [item.split("=", 1)]
    for value in [unquote(value.strip())]
}

if settings.OTEL_EXPORTER_OTLP_PROTOCOL == "http/protobuf":
    otlp_exporter = OTLPHttpSpanExporter(
        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers=otel_headers,
    )
else:
    otlp_exporter = OTLPGrpcSpanExporter(
        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers=otel_headers,
        insecure=settings.OTEL_EXPORTER_OTLP_ENDPOINT.startswith("http://"),
    )
span_processor = (
    SimpleSpanProcessor(otlp_exporter)
    if os.getenv("VERCEL") == "1"
    else BatchSpanProcessor(otlp_exporter)
)
trace.get_tracer_provider().add_span_processor(span_processor)

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
    version=settings.OTEL_SERVICE_VERSION,
    lifespan=lifespan,
)
meter = get_meter(__name__)

# Create a custom counter metric
request_count = meter.create_counter(
    "custom_request_counter", description="Track customm request"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + [
        "https://playground-lilac-nine.vercel.app",
        "http://localhost:3000",
        "localhost:3000"
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
app.include_router(normalized_products.router, prefix=API_PREFIX)


@app.get("/")
async def root():
    request_count.add(1)
    return {"status": "healthy", "service": settings.APP_NAME}



@app.get("/health")
async def health_check():
    return {"status": "healthyyy"}


@app.get("/testing-otel")
async def test_opentelemetry():
    tracer = trace.get_tracer(__name__)
    request_count.add(1)
    with tracer.start_as_current_span("test_span"):
        return {"message": "OpenTelemetry is working!"}

FastAPIInstrumentor.instrument_app(app, tracer_provider=trace.get_tracer_provider())