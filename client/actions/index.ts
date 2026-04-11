"use server"

import { cache } from "react"
import { API_URL } from "@/lib/api"
import { SINGLE_USER } from "@/lib/gql"

type UsernameResponse = {
    data?: {
        SingleUserFake?: {
            name: string
            lastName: string
        }
    }
}

export const getUserName = cache(async (userId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${API_URL}/graphql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: SINGLE_USER,
                variables: { id: userId },
            }),
            // cache: "no-store", // ⚠️ this disables fetch caching
        })

        if (!response.ok) return null

        const user: UsernameResponse = await response.json()
        if (!user) return "Not found"

        return `${user.data?.SingleUserFake?.name} ${user.data?.SingleUserFake?.lastName}`.trim()
    } catch {
        return null
    }
})