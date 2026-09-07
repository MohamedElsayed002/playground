"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAddProductCard } from "@/hooks/use-add-product-card"
import { components } from "@/lib/api/schema"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link, { useLinkStatus } from "next/link"
import { useEffect, useState } from "react"
import { sileo } from "sileo"

type Product = components["schemas"]["ProductListResponse"]

export function LinkButton({ href, label = "View product" }: { href: string; label?: string }) {
    const { pending } = useLinkStatus()

    return (
        <span className="relative inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
            <span className={`transition-opacity duration-200 ${pending ? "opacity-0" : "opacity-100"}`}>
                {label}
            </span>
            <ArrowRight
                size={14}
                className={`shrink-0 transition-all duration-200 ${pending ? "opacity-0" : "opacity-100"}`}
            />

            {pending ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="h-4 w-4" />
                </div>
            ) : null}

            <span className="sr-only">Navigate to {href}</span>
        </span>
    )
}

export const SingleProduct = ({ item }: { item: Product }) => {
    const [now, setNow] = useState<number | null>(null)

    const { mutate, isPending } = useAddProductCard()

    useEffect(() => {
        const timer = window.setTimeout(() => setNow(Date.now()), 0)
        return () => window.clearTimeout(timer)
    }, [])

    const handleAddToCart = (productId: number) => {
        mutate({ productId, quantity: 1 }, {
            onSuccess: () => {
                sileo.success({
                    title: "Product added to cart"
                })
            },
            onError: (error) => {
                sileo.error({
                    title: error.message || "Failed to add product to cart",
                    description: "Please try again later.",
                })
            }
        })
    }

    const image = item.images?.[0]
    const activeFlashSale = now === null
        ? undefined
        : item.flash_sales?.find((sale) => {
            const startsAt = Date.parse(sale.starts_at)
            const endsAt = Date.parse(sale.ends_at)

            return (
                Number.isFinite(startsAt) &&
                Number.isFinite(endsAt) &&
                startsAt <= now &&
                now <= endsAt &&
                sale.remaining_quantity > 0
            )
        })
    const regularPrice = Number(item.price)
    const salePrice = activeFlashSale
        ? regularPrice * (1 - activeFlashSale.discount_percentage / 100)
        : regularPrice
    const productHref = `/small-ecommerce/${item.slug}`

    return (
        <div key={item.id} className="border p-10 shadow-md rounded-md">
            <div className="relative w-fit overflow-hidden rounded-md">
                <Link href={productHref} aria-label={`View ${item.name}`} className="block">
                    {image ? (
                        <Image src={image.url} alt={image.alt_text || item.name} width={300} height={300} />
                    ) : (
                        <div className="flex h-[300px] w-[300px] items-center justify-center bg-gray-100 text-sm text-gray-500">
                            No image available
                        </div>
                    )}
                </Link>
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    {activeFlashSale ? (
                        <Link
                            href={productHref}
                            aria-label={`View ${item.name} flash sale`}
                            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
                        >
                            {activeFlashSale.discount_percentage}% OFF
                        </Link>
                    ) : <span />}
                    {item.stock_quantity <= 0 && (
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            Out of stock
                        </span>
                    )}
                </div>
            </div>
            <div>
                <Link href={productHref} className="block hover:text-blue-600">
                    <h2 className="mt-4">{item.name}</h2>
                </Link>
                <div className='flex flex-wrap gap-5 justify-between items-center'>
                    <div>
                        <p className={activeFlashSale ? "font-semibold text-rose-700" : ""}>
                            Price ${salePrice.toFixed(2)}
                        </p>
                        {activeFlashSale ? (
                            <p className="text-sm text-gray-500 line-through">Was ${regularPrice.toFixed(2)}</p>
                        ) : item.compare_at_price ? (
                            <p>Compare at <span className='line-through'>${item.compare_at_price}</span></p>
                        ) : null}
                    </div>
                    <p>Stock {item.stock_quantity}</p>
                    <div className="flex justify-between">
                        <Button disabled={isPending || item.stock_quantity <= 0} onClick={() => handleAddToCart(item.id)} className='bg-blue-500'>
                            {item.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                        </Button>
                        <Link
                            href={productHref}
                            aria-label={`View product ${item.name}`}
                            className="ml-2 inline-flex"
                        >
                            <LinkButton href={productHref} label="View" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
