import GridBackground from "@/components/layouts/grid-background";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next"

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
                    <Link href="/small-ecommerce/snapshot" className='bg-violet-500 px-4 py-2 rounded-md text-white'>Snapshot</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {data.data?.items.map((item) => {
                        return (
                            <div key={item.id} className="border p-5 shadow-md rounded-md">
                                <Image src={item.images[0].url} alt={item.name} width={300} height={300} />
                                <div>
                                    <h2>{item.name}</h2>
                                    <div className='flex justify-between items-center'>
                                        <p>${item.price}</p>
                                        <div className="flex justify-between">
                                            <Button className='bg-blue-500'>Add to Cart</Button>
                                            <Link href={`/small-ecommerce/${item.slug}`} className='bg-green-500 ml-2 px-4 py-2 rounded-md text-white'>View</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>
        </GridBackground>
    )
}