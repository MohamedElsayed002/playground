from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.handlers import ConflictException, NotFoundException
from app.models.flash_sale import FlashSale
from app.models.product import Product
from app.schemas.flash_sale import CreateFlashSale

class FlashSaleService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session



    """
        Create Flash Sale 

        1- Authenticate User
        2- Get Product By ID 
        3- Verify Product exists
        4- Verify authenticated user owns the product 
        5- Validate Input
        6- Check whether the product is already in a flash sale
        7- Create Flash Sale
    """

    async def create_flash_sale(
            self,
            user_id: int,
        data: CreateFlashSale,
    ) -> FlashSale:
        product_result = await self.session.execute(
            select(Product).where(
                Product.id == data.product_id,
                Product.owner_id == user_id,
                Product.is_active == True,
                Product.is_deleted == False
            )
        )

        product = product_result.scalar_one_or_none()

        if not product:
            raise NotFoundException("Owned active product", data.product_id)

        flash_sale_exist = await self.session.execute(select(FlashSale).where(FlashSale.product_id == data.product_id))

        already_exist = flash_sale_exist.scalar_one_or_none()

        if already_exist:
            raise ConflictException("This product already has a flash sale")

        flash_sale = FlashSale(
            product_id=data.product_id,
            starts_at=data.starts_at.isoformat(),
            ends_at=data.ends_at.isoformat(),
            discount_percentage=data.discount_percentage,
            sale_quantity=data.sale_quantity,
            remaining_quantity=data.sale_quantity,
            status="scheduled",
        )

        self.session.add(flash_sale)
        await self.session.flush()
        await self.session.refresh(flash_sale)
        return flash_sale

