"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

const url = "https://api.github.com/users/MohamedElsayed002"


export default function Page() {

    const [counter, setCounter] = useState(0)
    const [loading, setLoading] = useState(true)
    const [githubUser, setGithubUser] = useState()


    const increment = () => {
        setCounter((prev) => prev + 1)
    }

    const decrement = () => {
        if (counter === 0) return
        setCounter((prev) => prev - 1)
    }

    useEffect(() => {
        console.log('Hello')
    }, [])

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(url)
                const data = await response.json()
                setGithubUser(data)
            } catch (error) {
                console.log(error)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [])

    // Clear Interval
    useEffect(() => {
        const run = setInterval(() => {
            console.log('running')
        }, 2000)

        return () => clearInterval(run)
    },[])

    return (
        <div>
            {loading ? (
                <h1>Loading</h1>
            ) : (
                <>
                    {counter}
                    <Button onClick={increment}>+</Button>
                    <Button onClick={decrement}>-</Button>
                    <img src={githubUser.avatar_url} width={200} height={200} alt={githubUser.name} />
                    <h1>{githubUser.name}</h1>
                    <h1>{githubUser.bio}</h1>
                </>
            )}
        </div>
    )
}