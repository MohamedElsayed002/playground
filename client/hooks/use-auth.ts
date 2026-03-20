'use client'

import { useMutation, useQueryClient} from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi, tokenStorage } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { disconnectSocket} from '@/lib/socket'


export function useRegister() {
    const setSession = useAuthStore((s) => s.setSession)
    const router = useRouter()

    return useMutation({
        mutationFn: (data: {email: string,password: string,username: string}) => authApi.register(data),
        onSuccess: (data) => {
            setSession(data.profile,{accessToken: data.accessToken,refreshToken: data.refreshToken})
            router.push('/')
        }
    })
}


export function useLogin() {
    const setSession = useAuthStore((s) => s.setSession)
    const router = useRouter()


    return useMutation({
        mutationFn: (data: {email: string, password: string}) => authApi.login(data),
        onSuccess: (data) => {
            setSession(data.profile,{accessToken:data.accessToken,refreshToken: data.refreshToken})
            router.push('/')
        }
    })
}

export function useLogout() {
    const clearSession = useAuthStore((s) => s.clearSession)
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationFn: () => {
            const refreshToken = tokenStorage.getRefresh();
            return refreshToken ? authApi.logout(refreshToken) : Promise.resolve({success:true})
        },
        onSettled: () => {
            clearSession()
            disconnectSocket()
            queryClient.clear()
            router.push('/login')
        }
    })
    
}