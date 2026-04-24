"use client"

import Image from 'next/image'
import { api } from '@/lib/api/client'
import { ProductsResponse } from '@/types/openapi-typescript'
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import { useState, useEffect } from 'react'
export default function Page() {

    const [name,setName] = useQueryState('search',{
        // defaultValue: '',
        clearOnDefault: true
    })
    const [data,setData] = useState<ProductsResponse | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const response = await api.GET(`/api/v1/products`,{
                params: {
                    query: {
                        search: name ?? undefined,
                        category_id: 6,
                        featured:false,
                        page: 1,
                        page_size:10
                    }
                }
            })
            if(response.data) {
                setData(response.data)
            }
        }

        fetchData()
    },[name])


    return (
        <div>
            <h1>Mohamed NUQS</h1>

            <div>
                <input value={name || ''} onChange={e => setName(e.target.value)} />
                <button onClick={() => setName(null)}>Clear</button>
                <p>Hello, {name || 'Anonymous visitor'}</p>
            </div>
            {data?.page_size} {data?.items.map((item) => (
                <div key={item.id}>
                    <h1>{item.name}</h1>
                    <div>
                        {item.images.map((img) => (
                            <Image key={img.id}  src={img.url} alt={img.alt_text ?? "default alt"} width={500} height={500}/>
                        ))}
                    </div>
                </div>
            ))}

              
        </div>

    )
}