"use client"

import { Button } from "@/components/ui/button"
import { useAddProductCard } from "@/hooks/use-add-product-card"
import type { components } from "@/lib/api/schema"
import Image from "next/image"
import Link from "next/link"
import { sileo } from "sileo"


type Product = components["schemas"]["ProductListResponse"]

type Products = {
    products: Product[]
}


export const ProductsGrid = ({ products }: Products) => {

    const { mutate, isPending, error } = useAddProductCard()

    const handleAddToCart = (productId: number) => {
        mutate({productId, quantity: 1}, {
            onSuccess: (data) => {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {products.map((item) => {
                return (
                    <div key={item.id} className="border p-5 shadow-md rounded-md">
                        <Image src={item.images[0].url} alt={item.name} width={300} height={300} />
                        <div>
                            <h2>{item.name}</h2>
                            <div className='flex justify-between items-center'>
                                <p>Price ${item.price}</p>
                                <p>Compare at <span className='line-through'>${item.compare_at_price}</span></p>
                                <p>Stock {item.stock_quantity}</p>
                                <div className="flex justify-between">
                                    <Button disabled={isPending || item.stock_quantity <= 0} onClick={() => handleAddToCart(item.id)} className='bg-blue-500'>
                                        {item.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                                    </Button>
                                    <Link href={`/small-ecommerce/${item.slug}`} className='bg-green-500 ml-2 px-4 py-2 rounded-md text-white'>View</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}