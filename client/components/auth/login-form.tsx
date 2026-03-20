'use client'

import { FormEvent, useState } from "react";
import { useLogin } from "@/hooks/use-auth";

export function LoginForm() {
    const login = useLogin()
    const [form,setForm] = useState({email: '', password: ''})

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        login.mutate(form)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
            <h1 className="text-2xl font-bold">Sign in</h1>

            {login.error && (
                <p className="text-red-500 text-sm">
                    {(login.error as Error).message}
                </p>
            )}

            <input 
                type='email'
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="border rounded px-3 py-2 text-sm"
                />
                <input
                    type='password'
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({...f, password: e.target.value}))}
                    required
                    className="border rounded px-3 py-2 text-sm"
                />
                <button
                    type='submit'
                    disabled={login.isPending}
                    className="bg-blue-600 text-white rounded py-2 text-sm font-medium"
                >
                    {login.isPending ? 'Signing in' : 'Sign in'}
                </button>
        </form>
    )
}