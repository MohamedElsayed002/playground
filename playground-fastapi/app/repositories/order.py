from sqlalchemy import select 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.repositories.base import BaseRepository

class OrderRepository(BaseRepository[Order]):
    model = Order

    def __init__(self,session: AsyncSession) -> None:
        super().__init__(session)

    async def get_with_items(self,order_id: int) -> Order | None:
        """
            Single Item Query
        """
        result = await self.session.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )

        return result.scalars().first()
    
    async def list_for_user(
            self,
            user_id: int,
            limit: int = 20,
            offset: int = 0
    ) -> list[Order]:
        result = await self.session.execute(
            select(Order).where(Order.user_id == user_id).order_by(Order.id.desc()).limit(limit).offset(offset).options(selectin(Order.items))
        )

        return list(result.scalars().all())
    
    async def get_by_order_number(self, order_number: str) -> Order | None:
        result = await self.session.execute(
            select(Order).where(Order.order_number == order_number)
        )
        return result.scalars().first()
    
    async def list_by_status(self,status: OrderStatus, limit: int = 100) -> list[Order]:
        result = await self.session.execute(
            select(Order).where(Order.status == status).order_by(Order.id.desc()).limit(limit)
        )

        return list(result.scalar().all())
    

class OrderItemRepository(BaseRepository[OrderItem]):
    model = OrderItem

    def __init__(self, session: AsyncSession) -> None:
        super().init__(session)