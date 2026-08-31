"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAddProductCard } from "@/hooks/use-add-product-card"
import { components } from "@/lib/api/schema"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link, { useLinkStatus } from "next/link"
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

    const { mutate, isPending } = useAddProductCard()

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

    return (
        <div key={item.id} className="border p-10 shadow-md rounded-md">
            <Image src={item.images[0].url} alt={item.name} width={300} height={300} />
            <div>
                <h2>Name: {item.name}</h2>
                <div className='flex flex-wrap gap-5 justify-between items-center'>
                    <p>Price ${item.price}</p>
                    <p>Compare at <span className='line-through'>${item.compare_at_price}</span></p>
                    <p>Stock {item.stock_quantity}</p>
                    <div className="flex justify-between">
                        <Button disabled={isPending || item.stock_quantity <= 0} onClick={() => handleAddToCart(item.id)} className='bg-blue-500'>
                            {item.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                        </Button>
                        <Link
                            href={`/small-ecommerce/${item.slug}`}
                            aria-label={`View product ${item.name}`}
                            className="ml-2 inline-flex"
                        >
                            <LinkButton href={`/small-ecommerce/${item.slug}`} label="View" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
