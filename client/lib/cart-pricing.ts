import { components } from "@/lib/api/schema"

type Product = components["schemas"]["ProductResponse"]

export type CartPriceBreakdown = {
    regularUnitPrice: number
    saleUnitPrice: number | null
    discountedQuantity: number
    regularQuantity: number
    total: number
    sale: components["schemas"]["FlashSaleResponse"] | null
}

function toNumber(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return null

    const numberValue = typeof value === "number" ? value : Number(value)
    return Number.isFinite(numberValue) ? numberValue : null
}

export function getActiveFlashSale(product: Product, now = new Date()) {
    return (product.flash_sales ?? []).find((sale) => {
        const startsAt = new Date(sale.starts_at)
        const endsAt = new Date(sale.ends_at)
        const status = sale.status.toLowerCase()

        return (
            (status === "active" || status === "scheduled") &&
            Number.isFinite(startsAt.getTime()) &&
            Number.isFinite(endsAt.getTime()) &&
            startsAt <= now &&
            now <= endsAt &&
            sale.remaining_quantity > 0
        )
    }) ?? null
}

export function getCartPriceBreakdown(
    product: Product,
    quantity: number,
    now = new Date(),
): CartPriceBreakdown {
    const regularUnitPrice = toNumber(product.price) ?? 0
    const sale = getActiveFlashSale(product, now)
    const discount = sale ? Math.min(Math.max(sale.discount_percentage, 0), 100) : 0
    const saleUnitPrice = sale
        ? regularUnitPrice * (1 - discount / 100)
        : null
    const discountedQuantity = sale ? Math.min(1, quantity, sale.remaining_quantity) : 0
    const regularQuantity = Math.max(quantity - discountedQuantity, 0)

    return {
        regularUnitPrice,
        saleUnitPrice,
        discountedQuantity,
        regularQuantity,
        total:
            (saleUnitPrice ?? regularUnitPrice) * discountedQuantity +
            regularUnitPrice * regularQuantity,
        sale,
    }
}

export function formatPrice(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "N/A"

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value)
}

export function formatSaleDate(value: string) {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return ""

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date)
}