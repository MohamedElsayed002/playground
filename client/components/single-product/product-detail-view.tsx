import type { ProductDetail } from "@/types/products"
import { ProductDetails } from "./product-details"
import { ProductGallery } from "./product-gallery"

interface ProductDetailViewProps {
    product: ProductDetail | null
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
    if (!product) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                Product not found.
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <ProductGallery product={product} />
                    <ProductDetails product={product} />
                </div>
            </div>
        </div>
    )
}
