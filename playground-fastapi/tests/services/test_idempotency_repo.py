import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("BUCKET_NAME", "test-bucket")
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test-secret")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai")
os.environ.setdefault("RESEND_API_KEY", "test-resend")
os.environ.setdefault("WORKOS_ORGANIZATION_ID", "org")
os.environ.setdefault("WORKOS_CLIENT_ID", "client")
os.environ.setdefault("WORKOS_API_KEY", "api")
os.environ.setdefault("STRIPE_SECRET_KEY", "stripe")
os.environ.setdefault("STRIPE_PUBLISHABLE_KEY", "stripe-pub")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "webhook")

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.idempotency import IdempotencyKey
from app.repositories.idempotency import IdempotencyRepository


@pytest.mark.asyncio
async def test_expired_idempotency_keys_are_ignored_and_removed_before_reuse():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(IdempotencyKey.__table__.create)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        repo = IdempotencyRepository(session)

        expired = IdempotencyKey(
            key="checkout-key-1",
            user_id=42,
            request_path="/checkout",
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
            response_body='{"status": "stale"}',
            response_status_code=200,
        )
        session.add(expired)
        await session.commit()

        assert await repo.get_by_key("checkout-key-1", user_id=42) is None

        created = await repo.create_lock("checkout-key-1", 42, "/checkout")

        assert created.key == "checkout-key-1"

        total = await session.scalar(
            select(func.count()).select_from(IdempotencyKey).where(IdempotencyKey.key == "checkout-key-1")
        )
        assert total == 1
        assert await repo.get_by_key("checkout-key-1", user_id=42) is not None
