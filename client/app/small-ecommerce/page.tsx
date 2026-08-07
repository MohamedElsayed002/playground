import GridBackground from "@/components/layouts/grid-background";
import { api } from "@/lib/api/client";
import Link from "next/link";
import { Metadata } from "next"
import { ProductsGrid } from "./products-grid";

export const metadata: Metadata = {
    title: "Small E-commerce"
}
export default async function Page() {

    const data = await api.GET("/api/v1/products")


 
    return (
        <GridBackground
            className="min-h-dvh bg-gray-300 dark:bg-zinc-950"
            squares={[
                [2, 1],
                [5, 2],
                [8, 1],
                [1, 5],
                [4, 6],
                [9, 6],
                [12, 4],
                [14, 8],
                [6, 10],
            ]}
        >
            <main className="container mx-auto p-10">
                <h1 className='text-3xl text-center mb-5'>Small E-Commerce</h1>
                <div className="flex justify-between">
                    <h1 className='text-2xl text-blue-500'>Total Products: {data.data?.items.length}</h1>
                    <div className='flex gap-2'>
                    <Link href="/small-ecommerce/cart" className='bg-blue-500 px-4 py-2 rounded-md text-white'>User Cart</Link>
                    <Link href="/small-ecommerce/snapshot" className='bg-violet-500 px-4 py-2 rounded-md text-white'>Snapshot</Link>

                    </div>
                </div>
                <ProductsGrid products={data.data?.items || []} />
            </main>
        </GridBackground>
    )
}