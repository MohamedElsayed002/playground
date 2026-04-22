"""
app/db/session.py
──────────────────
Creates the async SQLAlchemy engine + session factory.

NestJS/TypeORM equivalent → DataSource configuration in AppModule
FastAPI approach  → create_async_engine + async_sessionmaker

WHY ASYNC?
  FastAPI is built on top of Starlette (ASGI) and supports true async I/O.
  Using async DB calls means your server can handle other requests while
  waiting for the database — just like await in Node.js/NestJS.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def create_all_tables():
    from app.db.base import Base

    import app.models 

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)