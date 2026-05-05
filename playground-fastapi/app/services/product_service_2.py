from sqlalchemy.ext .asyncio import AsyncSession

from app.exceptions.handlers import ConflictException, NotFoundException
from app.models.product import Product
from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.product_service import _unique_slug


# Same idea from NestJS. because I came from NestJS background :) 
# there is another file in same dir `product_service` same purpose 
# even though I didn't use repository in NestJS :"D 

class ProductService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.product_repo = ProductRepository(session)

    async def get_product(self, product_id: int) -> Product:
        product = await self.product_repo.get_by_id(product_id)
        
        if not product or product.is_deleted:
            raise NotFoundException(f"Product {product_id} not found")
        return product
    
    async def get_by_slug(self, slug: str) -> Product:
        product = await self.product_repo.get_by_slug(slug)
        if not product:
            raise NotFoundException(f"Product with slug '{slug} not found")
        return product
    
    async def list_products(
            self,
            category_id: int | None = None,
            limit: int = 20,
            offset: int = 0
    ) -> list[Product]:
        return await self.product_repo.list_active(
            category_id=category_id, limit=limit,offset=offset
        )

    async def create_product(self,data: ProductCreate) -> Product:
        if data.slug and await self.product_repo.get_by_slug(data.slug):
            raise ConflictException(f"Slug '{data.slug}' already in use")

        product = Product(**data.model_dump())
        self.product_repo.add(product)
        await self.session.commit()
        await self.session.refresh(product)
        return product
    
    async def update_product(self, product_id: int, data: ProductUpdate) -> Product:
        product = await self.get_product(product_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product,field,value)
        await self.session.commit()
        await self.session.refresh(product)
        return product
    
    async def soft_delete(self, product_id: int) -> None:
        product = await self.get_product(product_id)
        product.is_deleted = True
        product.is_active = False
        await self.session.commit()

    async def adjust_stock(self, product_id: int, delta: int) -> Product:
        # For admin
        product = await self.product_repo.get_for_update(product_id)
        if not product:
            raise NotFoundException(f"Product {product_id} not found")
        
        new_qty = product.stock_quantity + delta
        if new_qty < 0:
            raise ValueError("Stock cannot go below 0")
        product.stock_quantity = new_qty
        await self.session.commit()
        await self.session.refresh(product)
        return product
        
        