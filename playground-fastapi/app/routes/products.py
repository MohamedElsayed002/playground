from fastapi import APIRouter, Depends, Query, UploadFile, File, status, Form 
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
    categories = await product_service.list_categories(db)
    return [CategoryResponse.model_validate(category) for category in categories]


@router.get('/categories/{category_slug}', response_model=CategoryWithChildren)
async def category_slug(category_slug: str,db: AsyncSession= Depends(get_db)):
    """
        Get Category by Slug
    """
    category = await product_service.get_category_by_slug(db,category_slug)
    return CategoryWithChildren.model_validate(category)



@router.get("/categories/{category_id}",response_model=CategoryWithChildren)
async def get_category(
    category_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """
        Get a category with its sub-categories. Public
    """
    category = await product_service.get_category(db,category_id)
    return CategoryWithChildren.model_validate(category)


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_category(
    name: str = Form(...),
    description: str | None = Form(default=None),
    parent_id: int | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db)
):
    """
    [Admin] Create a new category.
    Send as multipart/form-data when uploading an image.
    """
    image_url: str | None = None

    if file is not None:
        upload_result = await file_service.upload_image(file, subfolder="categories")
        image_url = upload_result.url

    data = CategoryCreate(
        name=name,
        description=description,
        image_url=image_url,
        parent_id=parent_id,
    )

    category = await product_service.create_category(db, data)
    return CategoryResponse.model_validate(category)

@router.patch(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_admin)],
)
async def update_category(
    category_id: int,
    name: str | None = Form(default=None),
    description: str | None = Form(default=None),
    parent_id: int | None = Form(default=None),
    image_url: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db)
):
    """
        Admin Update a category.
        Send as multipart/form-data when updating fields or uploading an image.
    """
    update_data: dict[str, str | int | None] = {}

    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if parent_id is not None:
        update_data["parent_id"] = parent_id
    if image_url is not None:
        update_data["image_url"] = image_url

    if file is not None:
        upload_result = await file_service.upload_image(file, subfolder="categories")
        update_data["image_url"] = upload_result.url

    data = CategoryUpdate(**update_data)
    category = await product_service.update_category(db,category_id,data)
    return CategoryResponse.model_validate(category)

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


@router.delete(
    "/products/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_product_image(
    product_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
):
    """[Admin] Delete a specific image for a product."""
    await product_service.delete_product_image(db, product_id, image_id)


@router.delete(
    "/products/{product_id}/images",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_product_image_compat(
    product_id: int,
    image_id: int = Query(..., ge=1),
    db: AsyncSession = Depends(get_db),
):
    """
    [Admin] Backward-compatible delete endpoint using a query param.
    Preferred route: DELETE /products/{product_id}/images/{image_id}
    """
    await product_service.delete_product_image(db, product_id, image_id)
