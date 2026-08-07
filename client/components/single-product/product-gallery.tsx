import Link from "next/link"
import type { ProductDetail } from "@/types/products"

interface ProductGalleryProps {
    product: ProductDetail
}

export function ProductGallery({ product }: ProductGalleryProps) {
    const images = product.images?.filter(Boolean) || []
    const primaryImage = images[0]?.url || "https://placehold.co/800x800/png?text=No+Image"

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img
                    src={primaryImage}
                    alt={product.name}
                    className="h-[420px] w-full rounded-xl object-cover"
                />
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                    {images.map((image, index) => (
                        <div key={`${image.url}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                            <img
                                src={image.url}
                                alt={image.alt_text || `${product.name} image ${index + 1}`}
                                className="h-24 w-full rounded-lg object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            <Link href="/small-ecommerce" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                ← Back to products
            </Link>
        </div>
    )
}
