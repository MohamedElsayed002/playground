export interface CartProductImage {
    id?: number
    url: string
    alt_text?: string | null
    is_primary?: boolean
    sort_order?: number
}

export interface CartProduct {
    id: number
    name: string
    slug: string
    description?: string | null
    short_description?: string | null
    price: string | number
    compare_at_price?: string | number | null
    stock_quantity?: number
    sku?: string | null
    is_active?: boolean
    is_featured?: boolean
    category_id?: number | null
    images?: CartProductImage[]
    created_at?: string | null
}

export interface CartItem {
    id: number
    quantity: number
    product: CartProduct
}

export interface CartData {
    id: number
    user_id: number
    items: CartItem[]
    subtotal: string | number
}
