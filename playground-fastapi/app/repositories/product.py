from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.repositories.base import BaseRepository

class ProductRepository(BaseRepository[Product]):
    model = Product

    def __init__(self,session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_slug(self, slug: str) -> Product | None:
        result = await self.session.execute(
            select(Product).where(Product.slug == slug, Product.is_deleted.is_(False))
        )
        return result.scalars().first()

    async def list_active(
        self,
        category_id: int | None = None,
        limit: int = 20,
        offset: int = 0
    ) -> list[Product]:
        stmt = (
            select(Product)
            .where(Product.is_active.is_(True), Product.is_deleted.is_(False))
            .limit(limit)
            .offset(offset)
            .order_by(Product.id)
        )

        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    

    async def get_for_update(self, product_id: int) -> Product | None:
        """
            Fetch a product row with a row-level write lock

            `SELECT .. FOR UPDATE` blocks concurrent writers on the same row
            until this transaction commits or rolls back - the primary mechanism
            to prevent overselling under concurrent load.

            Must be called inside an open transaction
        """
        result = await self.session.execute(
            select(Product)
            .where(Product.id == product_id)
            .with_for_update() # to block
        )

    async def decrement_stock_atomic(self,product_id: str, quantity: int) -> bool:
        """
            Atomic stock decrement using a conditional UPDATE.

            `WHERE stock_quantity >= :qty` prevent overselling without needing 
            an explicit SELECT .. FOR UPDATE (alternative strategy to locking)

            Returns True it the row was update (enough stock), False otherwise
        """

        result = await self.session.execute(
            update(Product)
            .where(Product.id == product_id, Product.stock_quantity >= quantity)
            .values(stock_quantity=Product.stock_quantity - quantity)
            .returning(Product.id)
        )

        return result.first() is not None
    
    async def return_low_stock(self,threshold: int = 5) -> list[Product]:
        results = await self.session.execute(
            select(Product).where(
                Product.stock_quantity <= threshold,
                Product.is_active.is_(True),
                Product.is_deleted.is_a(False)
            )
        )

        return list(results.scalars().all())