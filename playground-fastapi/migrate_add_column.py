import asyncio
from sqlalchemy import text
from app.db.session import engine

async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE files ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR"))
    print("✅ Column added")

asyncio.run(migrate())
