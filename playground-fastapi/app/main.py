import logging
from contextlib import asynccontextmanager
import os
from urllib.parse import unquote

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings

import inngest.fast_api

import stripe


stripe.api_key = settings.STRIPE_SECRET_KEY

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

from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.exceptions.handlers import register_exception_handlers
from app.db.session import create_all_tables
from app.routes import auth, users, products, orders, files, audit_logs, normalized_products, flash_sale
from app.services.inngest import inngest_client, inngest_functions


from app.tools.strands import create_agent
from app.schemas.assistant import ShopAssistantRequest, ShopAssistantResponse
from app.core.dependencies import get_current_user, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.services import chat_service
from app.models.user import User
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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Idempotency-Key",
    ],
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
app.include_router(flash_sale.router, prefix=API_PREFIX)


@app.get("/")
async def root():
    return {"status": "FastAPI Application Playground ", "service": settings.APP_NAME}




@app.post(
    f"{API_PREFIX}/shop-assistant-bot",
    response_model=ShopAssistantResponse,
    tags=["Shopping Assistant"],
)
@limiter.limit("10/minute")
async def chat_bot(
    request: Request,
    data: ShopAssistantRequest,
    current_user: User=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await chat_service.get_or_create_conversation(
        db, current_user.id, data.conversation_id
    )

    context = await chat_service.get_context_messages(db, conversation.id)

    user_message = data.message

    await chat_service.save_message(
        db, conversation.id, "user", user_message
    )

    agent = create_agent(db=db, user_id=current_user.id, messages=context)

    result = await agent.invoke_async(user_message)
    reply = "".join(
        block["text"]
        for block in result.message.get("content", [])
        if isinstance(block, dict) and isinstance(block.get("text"), str)
    )

    reply = (reply or "I couldn't generate a response.")[:4000]
    await chat_service.save_message(db, conversation.id, "assistant", reply)
    return ShopAssistantResponse(reply=reply, conversation_id=conversation.id)



@app.get("/health")
async def health_check():
    return {"status": "healthy"}
