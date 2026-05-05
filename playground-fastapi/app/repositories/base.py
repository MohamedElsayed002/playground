from typing import Any, Generic, TypeVar 

from sqlalchemy import select 
from sqlalchemy.ext.asyncio import AsyncSession 

from app.exceptions.handlers import NotFoundException

from app.db.base import Base 

ModelT = TypeVar("ModelT",bound=Base)

class BaseRepository(Generic[ModelT]):

    """
        Thin data-access layer wrapping a single SQLAlchemy model.

        Repositories are the "only* place that should touch the DB session directly.
        Services orchestrate repositories within a transaction; they never call
        `session.execute` themselves
    """

    model: type[ModelT]

    def __init__(self,session: AsyncSession) -> None:
        self.session = session
    

    async def get_by_id(self,obj_id: int) -> ModelT | None:
        return await self.session.get(self.model,obj_id)
    
    async def get_by_id_or_raise(self,obj_id:int, label: str | None = None) -> ModelT:
        obj = await self.session.get(self.model,obj_id)

        if obj is None:
            name = label or self.model.__name__ 
            raise NotFoundException(f"{name} Not found {obj_id} ")
        return obj
    
    async def list_all(self, limit: int= 20, offset: int = 0) -> list[ModelT]:
        result = await self.session.execute(
            select(self.model).limit(limit).offset(offset)
        )

        return list(result.scalars().all())
    
    def add(self, obj: ModelT) -> ModelT:
        """
            Stage an object for insertion - caller must commit
        """
        self.session.add(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.session.delete(obj)
    
    async def flush(self) -> None:
        """
            Flush staged changes to DB within the current transaction (no commit).
        """
        await self.session.flush()
    
    async def refresh(self, obj: ModelT) -> None:
        await self.session.refresh(obj)
    
    async def filter_by(self, **kwargs: Any) -> list[ModelT]:
        conditions = [getattr(self.model,k) == v for k, v in kwargs.items()]
        result = await self.session.execute(select(self.model).where(*conditions))
        return list(result.scalars().all())
    
    async def first_where(self, **kwargs: Any) -> ModelT | None:
        conditions = [getattr(self.model, k) == v for k,v in kwargs.items()]
        result = await self.session.execute(select(self.model).where(*conditions).limit(1))
        return result.scalars().first()
