import { api } from "@/lib/api/client"
import { Metadata } from "next"

interface PageProps {
    params: { productSlug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { productSlug } = await params
    const data = await api.GET('/api/v1/products/slug/{slug}',{
        params: {
            path: {
                slug: productSlug
            }
        }
    })
    return {
        title: data.data?.name || 'Product not found',
        description: data.data?.description || 'Description not available'
    }
}

export default async function Page({ params }: PageProps) {
    const { productSlug } = await params
    const data = await api.GET(`/api/v1/products/slug/{slug}`,{
        params: {
            path: {
                slug: productSlug
            }
        }
    })
    return <div>{JSON.stringify(data)}</div>
}