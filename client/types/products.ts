export interface ProductImageData {
    id?: number
    url: string
    alt_text?: string | null
    is_primary?: boolean
    sort_order?: number
}


export interface ProductFlashSale {
    id: number
    product_id: number
    starts_at: string
    ends_at: string
    discount_percentage: number
    sale_quantity: number
    remaining_quantity: number
    status: string
}

export interface ProductDetail {
    id: number
    name: string
    slug: string
    description?: string | null
    short_description?: string | null
    price: string | number
    compare_at_price?: string | number | null
    stock_quantity: number
    sku?: string | null
    is_active: boolean
    is_featured: boolean
    category_id?: number | null
    images?: ProductImageData[]
    created_at?: string | null
    flash_sales?: ProductFlashSale[]
}

