'use client'

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { authApi, tokenStorage } from "@/lib/api"
import { clearAuthCookiesAction, loginAction, registerAction } from "@/actions/auth.actions"
import { useAuthStore } from "@/store/auth.store"
import { sileo } from "sileo"
import { disconnectSocket } from "@/lib/socket"

export function useRegister() {
    const setSession = useAuthStore((s) => s.setSession)
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: { email: string, password: string, username: string }) => {
            const formData = new FormData()
            formData.set('email', data.email)
            formData.set('password', data.password)
            formData.set('username', data.username)
            return registerAction(formData)
        },
        onSuccess: (data) => {
            setSession(data.profile, { accessToken: data.accessToken, refreshToken: data.refreshToken })
            router.push('/')
        }
    })
}

export function useLogin() {
    const setSession = useAuthStore((s) => s.setSession)
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: { email: string, password: string }) => {
            const formData = new FormData()
            formData.set('email', data.email)
            formData.set('password', data.password)
            return loginAction(formData)
        },
        onSuccess: (data) => {
            setSession(data.profile, { accessToken: data.accessToken, refreshToken: data.refreshToken })
            router.push('/')
        }
    })
}

export function useLogout() {
    const clearSession = useAuthStore((s) => s.clearSession)
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationFn: async () => {
            const refreshToken = tokenStorage.getRefresh()
            if (refreshToken) {
                await authApi.logout(refreshToken).catch(() => null)
            }
            await clearAuthCookiesAction()
        },
        onSettled: () => {
            clearSession()
            disconnectSocket()
            queryClient.clear()
            sileo.success({
                title: "Successfully",
                description: "User logged out successfully"
            })
            router.push('/auth/login')
            router.refresh()
        }
    })
}