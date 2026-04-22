from fastapi import APIRouter, Depends, Query, UploadFile, File, status 
from sqlalchemy.ext.asyncio import AsyncSession 

from app.core.dependencies import get_db, require_admin 
from app.schemas.product import (
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryWithChildren,
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse, ProductImageResponse
)
from app.schemas.common import PaginatedResponse 
from app.services import product_service, file_service

router = APIRouter(tags=["Products"])


@router.get('/categories',response_model=list[CategoryResponse])
async def list_categoires(db: AsyncSession= Depends(get_db)):
    """
        Get all categories (flat list). Public
    """
    return await product_service.list_categories(db)

@router.get("/categoires/{category_id}",response_model=CategoryWithChildren)
async def get_category(
    category_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """
        Get a category with its sub-categories. Public
    """
    return await product_service.get_category(db,category_id)


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    [Admin] Create a new category.
    """
    return await product_service.create_category(db,data)

@router.patch(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_admin)],
)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
        Admin Update a category
    """
    return await product_service.update_category(db,category_id,data)

@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_category(category_id: int, db: AsyncSession= Depends(get_db)):
    """
        [Admin] Deelte a category
    """
    await product_service.delete_category(db,category_id)




# Products

@router.get('/products',response_model=PaginatedResponse[ProductListResponse])
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    category_id: int | None = Query(default=None),
    search: str | None = Query(default=None, min_length=2),
    featured: bool = Query(default=False),
    db: AsyncSession = Depends(get_db)    
):
    """
        Get Paginated products with optional filters

    Query params: ?page=1&page_size=20&category_id=3&search=phone&featured=true
    """
    return await product_service.list_products(
        db,
        page=page,
        page_size=page_size,
        category_id=category_id,
        search=search,
        featured_only=featured,        
    )



@router.get("/products/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a product by its URL slug. Public."""
    return await product_service.get_product_by_slug(db, slug)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Get a product by ID. Public."""
    return await product_service.get_product(db, product_id)


@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """[Admin] Create a new product."""
    return await product_service.create_product(db, data)


@router.patch(
    "/products/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_admin)],
)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """[Admin] Partially update a product (PATCH — only send changed fields)."""
    return await product_service.update_product(db, product_id, data)


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """[Admin] Soft-delete a product (it stays in DB for order history)."""
    await product_service.soft_delete_product(db, product_id)


# ── Product Image Upload ──────────────────────────────────────────────────────

@router.post(
    "/products/{product_id}/images",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = Query(default=False),
    alt_text: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    [Admin] Upload an image for a product.
    
    Flow:
    1. Validate and save the image file (file_service)
    2. Create a ProductImage DB record linking the URL to the product (product_service)
    """
    # Validate & save the file — returns the stored URL
    upload_result = await file_service.upload_image(file, subfolder="products")

    # Create the DB record
    image = await product_service.add_product_image(
        db,
        product_id=product_id,
        url=upload_result.url,
        alt_text=alt_text,
        is_primary=is_primary,
    )
    return image
