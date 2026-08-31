"use client"

import type { components } from "@/lib/api/schema"
import { SingleProduct } from "./single-product"


type Product = components["schemas"]["ProductListResponse"]

type Products = {
    products: Product[]
}


export const ProductsGrid = ({ products }: Products) => {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {products.map((item) => <SingleProduct key={item.id} item={item} />)}
        </div>
    )
}