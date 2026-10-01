from datetime import datetime, timedelta, timezone 

from sqlalchemy import delete, select 
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.idempotency import IdempotencyKey 
from app.repositories.base import BaseRepository


class IdempotencyRepository(BaseRepository[IdempotencyKey]):
    model = IdempotencyKey

    def __init__(self,session: AsyncSession) -> None:
        super().__init__(session)

    async def delete_expired(self, key: str | None = None, user_id: int | None = None) -> None:
        now = datetime.now(timezone.utc)
        stmt = delete(IdempotencyKey).where(IdempotencyKey.expires_at <= now)

        if key is not None:
            stmt = stmt.where(IdempotencyKey.key == key)
        if user_id is not None:
            stmt = stmt.where(IdempotencyKey.user_id == user_id)

        await self.session.execute(stmt)

    async def get_by_key(self, key: str, user_id: int | None = None) -> IdempotencyKey | None:
        now = datetime.now(timezone.utc)
        stmt = select(IdempotencyKey).where(
            IdempotencyKey.key == key,
            IdempotencyKey.expires_at > now,
        )

        if user_id is not None:
            stmt = stmt.where(IdempotencyKey.user_id == user_id)

        result = await self.session.execute(stmt)
        return result.scalars().first()
    
    async def create_lock(
            self,
            key: str,
            user_id: int | None,
            request_path: str
    ) -> IdempotencyKey:
        """
            Create an "incomplete* idempotency record (response_body=None)
            Signals that the operation is in-flight
            A unique constraint on `key` means concurrent requests will get 
            an IntegrityError, which we catch and turn into a 409
        """

        await self.delete_expired(key=key, user_id=user_id)

        expires_at = datetime.now(timezone.utc) + timedelta(
            hours=settings.IDEMPOTENCY_KEY_TTL_HOURS
        )

        record = IdempotencyKey(
            key=key,
            user_id=user_id,
            request_path=request_path,
            expires_at=expires_at
        )

        self.add(record)
        await self.flush()
        return record
    
    async def complete(
            self,
            record: IdempotencyKey,
            response_body: str, 
            status_code: int
    ) -> None:
        """
            Mark the operation as complete with its serialised response
        """
        record.response_body = response_body
        record.response_status_code = status_code
        await self.flush()