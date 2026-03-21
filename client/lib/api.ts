import type { AuthTokens } from "@/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TOKEN_KEY = 'chat_access_token'
const REFRESH_KEY = 'chat_refresh_token'


// Token Storage
export const tokenStorage = {
    getAccess: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
    getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null),
    setTokens: (tokens: Pick<AuthTokens, 'accessToken' | 'refreshToken'>) => {
        localStorage.setItem(TOKEN_KEY, tokens.accessToken)
        localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
    },
    clearTokens: () => {
        localStorage.removeItem(TOKEN_KEY),
            localStorage.removeItem(REFRESH_KEY)
    }
}

// Fetch Wrapper 
// Adds Authorization header, handles 401 _> token refresh -> retry once

let refreshPromise: Promise<void> | null = null

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = tokenStorage.getAccess()

    const res = await fetch(`${API_URL}/${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    })

    //  Refresh token 

    if (res.status === 401) {
        const refreshToken = tokenStorage.getRefresh()
        if (!refreshToken) throw new Error('Not authenticated')

        if (!refreshPromise) {
            refreshPromise = authApi.refresh(refreshToken)
                .then((data) => { tokenStorage.setTokens(data)})
                .catch(() => {tokenStorage.clearTokens()})
                .finally(() => { refreshPromise = null})
        }
        await refreshPromise

        // retry original request with the new token
        return apiFetch<T>(path,options)
    }

    if(!res.ok) {
        const error = await res.json().catch(() => ({message: res.statusText}))
        throw new Error(error.message ?? 'Request failed')
    }

    return res.json() as Promise<T>
}


export const authApi = {
    register: (body: { email: string; password: string; username: string }) =>
        apiFetch<AuthTokens>('auth/register', {
            method: 'POST', body: JSON.stringify(body)
        }),
    login: (body: {email: string; password: string}) =>
            apiFetch<AuthTokens>('auth/login',{ method: 'POST',body: JSON.stringify(body)
        }),
    refresh: (refreshToken: string) => 
            apiFetch<AuthTokens>('auth/refresh',{ method: 'POST', body: JSON.stringify({ refreshToken })
        }),
    logout: (refreshToken: string) => 
            apiFetch<{success:boolean}>('auth/logout', {method: 'POST', body: JSON.stringify({ refreshToken })
        }),
    logoutAll: () => 
            apiFetch<{success: boolean}>('auth/logout-all',{method: 'POST'}),
    me: () => apiFetch<{userId: string, profileId: string;email: string}>('auth/me')
}
