'use client'

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRegister } from "@/hooks/use-auth"

export function RegisterForm() {
    const register = useRegister()
    const [form,setForm] = useState({email: '',password: '',username: ''})

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        register.mutate(form)
    }


    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
            <h1 className="text-2xl font-bold">Create account</h1>

            {register.error && (
                <p className="bg-red-50 border border-red-200 text-red-600 rounded px-3 py-2 text-sm">
                    {(register.error as Error).message}
                </p>
            )}

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">User</label>
                <input
                    type='text'
                    placeholder="mosayed002"
                    value={form.username}
                    onChange={(e) => setForm((prev) => ({...prev,username: e.target.value}))}
                    minLength={2}
                    maxLength={30}
                    required
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                    type='email'
                    placeholder="mo@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({...prev,email: e.target.value}))}
                    required 
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                    type='password'
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({...prev,password: e.target.value}))}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <button
                type='submit'
                disabled={register.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                    {register.isPending ? 'Creating account' : 'Create account'}
                </button>

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </p>
        </form>
    )
}