"use client"

import { useEffect, useState } from 'react'

const url = "https://api.github.com/users/MohamedElsayed002"

const useFetchData = (url: string) => {
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const [data, setData] = useState(null)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const resp = await fetch(url)

                if(!resp.ok) {
                    setIsError(true)
                    setIsLoading(false)
                    return
                }

                const data = await resp.json()
                setData(data)
            } catch (error) {
                setIsError(true)
            } finally {
                setIsLoading(false)
            }
        }
        fetchUser()
    }, [])
    
    return {
        isLoading,
        isError,
        data
    }
}


export const useToggle = (defaultValue: boolean) => {
    const [show, setShow] = useState(defaultValue)

    const toggle = () => {
        setShow(!show)
    }

    return { show, toggle }
}


function MyComp() {
    const { show, toggle } = useToggle(false)
}
