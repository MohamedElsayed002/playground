"use server"

import { API_URL } from "@/lib/api"
import { SINGLE_USER } from "@/lib/gql"

export async function getUserName(userId: string): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/graphql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: SINGLE_USER,
                variables: { id: userId },
            }),
            cache: "no-store",
        })

        if (!res.ok) return null

        const json = await res.json() as {
            data?: { SingleUserFake?: { name: string; lastName: string } }
        }

        const user = json.data?.SingleUserFake
        if (!user) return 'Not Found'

        return `${user.name} ${user.lastName}`.trim()
    } catch {
        return null
    }
}