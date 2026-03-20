'use server'

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { authApi } from "@/lib/api"
import type { AuthTokens } from "@/types"

const ACCESS_COOKIE  = 'chat_access';
const REFRESH_COOKIE = 'chat_refresh';


async function saveTokensToCookies(tokens: AuthTokens) {
    const cookieStore = await cookies()
    cookieStore.set(ACCESS_COOKIE, tokens.accessToken, {
        httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 15
    })
    cookieStore.set(REFRESH_COOKIE,tokens.refreshToken, {
        httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7
    })
}

export async function registerAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    try {
        const tokens = await authApi.register({email,password,username})
        await saveTokensToCookies(tokens)
        return { 
            success: true,
            data: tokens
        }
    }catch(err) {
        const errMessage = err instanceof Error ? err.message : 'Error'
        return { success: false, error: errMessage}
    }
}

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string 
    const password = formData.get('password') as string

    try {
        const tokens = await authApi.login({email,password})
        await saveTokensToCookies(tokens)
    }catch(err) {
        const errMessage = err instanceof Error ? err.message : 'Error'
        return { 
            success:false,
            error: errMessage
        }
    }
}


export async function logoutAction() {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value

    if(refreshToken) {
        await authApi.logout(refreshToken).catch(() => null)
    }

    cookieStore.delete(ACCESS_COOKIE)
    cookieStore.delete(REFRESH_COOKIE)
    redirect('/login')
}

export async function getSession() {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_COOKIE)?.value
    if(!accessToken) return null

    try {
        const me = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`,{
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            cache: 'no-store'
        })

        if(!me.ok) return null
        return me.json() as Promise<{userId: string, profileId: string,email: string}>
    }catch {
        return null
    }
}