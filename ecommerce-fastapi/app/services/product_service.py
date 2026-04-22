import math 
import re 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.product import Product, ProductImage
from app.models.category import (Category)
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    CategoryCreate,
    CategoryUpdate
)
from app.exceptions.handlers import NotFoundException, ConflictException

def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


async def _unique_slug(db: AsyncSession, model, base_slug: str) -> str:
    """
        Append a number suffix if the slug already exists e.g, 'shoes' -> 'shoes-2'
    """
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(model).where(model.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        counter+=1
        slug=f"{base_slug}-{counter}"


async def create_category(db: AsyncSession, data: CategoryCreate) -> Category:
    slug = await _unique_slug(db,Category,_slugify(data.name))
    category = Category(
        name=data.name,
        slug=slug,
        description=data.description,
        image_url=data.image_url,
        parent_id=data.parent_id
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category

async def list_categories(db: AsyncSession) -> list[Category]:
    result = await db.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())

async def get_category(db: AsyncSession, category_id: int) -> Category:
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise NotFoundException("Category", category_id)
    return cat

async def update_category(db: AsyncSession, category_id: int, data: CategoryUpdate) -> Category:
    cat = await get_category(db,category_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat,field,value)
    await db.flush()
    await db.refresh(cat)
    return cat


async def delete_category(db: AsyncSession, category_id: int) -> None:
    cat = await get_category(db,category_id)
    await db.delete(cat)
    await db.flush()


# Product Service

async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    slug = await _unique_slug(db,Product,_slugify(data.name))
    product = Product(
        slug=slug,
        **data.model_dump(exclude_none=False)
    )

    product.slug = slug
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


async def list_products(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        category_id: int | None = None,
        search: str | None = None,
        featured_only: bool = False
) -> dict:
    
    query = select(Product).where(Product.is_deleted == False)

    if category_id:
        query = query.where(Product.category_id == category_id)
    if featured_only:
        query = query.where(Product.is_featured == True)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )

    # Get total count for pagination metadata
    count_query = select(func.count()).select_form(query.scalar_subquery())
    total = (await db.execute(count_query)).scalar_one()

    # Apply pagination
    offset = (page - 1) * page_size
    result = await db.execute(
        query.order_by(Product.created_at.desc()).offset(offset).limit(page_size)
    )
    products = list(result.scalars().all())

    return {
        "items": products,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    }



async def get_product(db: AsyncSession, product_id: int) -> Product:
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_deleted == False)  # noqa: E712
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product", product_id)
    return product


async def get_product_by_slug(db: AsyncSession, slug: str) -> Product:
    result = await db.execute(
        select(Product).where(Product.slug == slug, Product.is_deleted == False)  # noqa: E712
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product", slug)
    return product


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    product = await get_product(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.flush()
    await db.refresh(product)
    return product


async def soft_delete_product(db: AsyncSession, product_id: int) -> None:
    """
    Soft-delete — marks as deleted but keeps the DB row.
    Why? Products may be referenced in historical orders.
    """
    product = await get_product(db, product_id)
    product.is_deleted = True
    await db.flush()


async def add_product_image(
    db: AsyncSession,
    product_id: int,
    url: str,
    alt_text: str | None = None,
    is_primary: bool = False,
) -> ProductImage:
    """Add an image record linked to a product after uploading."""
    # If this is set as primary, unset all others first
    if is_primary:
        result = await db.execute(
            select(ProductImage).where(ProductImage.product_id == product_id)
        )
        for img in result.scalars().all():
            img.is_primary = False

    image = ProductImage(
        product_id=product_id,
        url=url,
        alt_text=alt_text,
        is_primary=is_primary,
    )
    db.add(image)
    await db.flush()
    await db.refresh(image)
    return image
