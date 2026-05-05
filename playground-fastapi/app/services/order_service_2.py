from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.handlers import NotFoundException, OrderCancellationError,ForbiddenException
from app.models.order import Order, OrderStatus
from app.repositories.order import OrderRepository
from app.repositories.product import ProductRepository
from app.models.user import UserRole

class OrderService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.order_repo = OrderRepository(session)
        self.product_repo = ProductRepository(session)

    async def get_order(self, order_id: int, user_id: int, role: str) -> Order:
        order = await self.order_repo.get_with_items(order_id)
        if not order:
            raise NotFoundException(f"Order {order_id} not found")
        
        if role != UserRole.ADMIN and order.user_id != user_id:
            raise ForbiddenException("You do not have access to this order")
        
        return order
    
    async def list_user_orders(
        self,
        user_id:int,
        limit: int = 20,
        offset: int =0
    ) -> list[Order]:
        return await self.order_repo.list_for_user(user_id,limit=limit,offset=offset)
    
    async def cancel_order(self,order_id: int, user_id: int, role: str) -> Order:
        order = await self.get_order(order_id,user_id,role)

        if order.status in [OrderStatus.SHIPPED,OrderStatus.DELIVERED,OrderStatus.CANCELLED]:
            raise OrderCancellationError(
                f"Cannot cancel an order with status '{order.status.value}'"
            )
        
        order.status = OrderStatus.CANCELLED

        for item in order.items:
            if item.product_id is not None:
                product = await self.product_repo.get_for_update(item.product_id)
                if product:
                    product.stock_quantity += item.quantity

        await self.session.commit()

        return order
    
    async def update_status(self, order_id: int, new_status: OrderStatus) -> Order:
        """
            Admin-only change the status
        """

        order = await self.order_repo.get_by_id_or_raise(order_id,"Order")

        old_status = order.status
        order.status = new_status
        await self.session.commit()
        await self.session.refresh(order)

        return order
    
    async def list_all_orders(
        self,
        status: OrderStatus | None = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[Order]:
        if status:
            return await self.order_repo.list_by_status(status,limit=limit)
        return await self.order_repo.list_all(limit=limit, offset=offset)
    
    