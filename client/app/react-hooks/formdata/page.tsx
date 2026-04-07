"use client"

import { Button } from "@/components/ui/button";
import { FormEvent } from "react";

export default function Page() {

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        // const name = formData.get('name')
        // const email = formData.get('email')
        // const lastName = formData.get('lastName')
        // const password = formData.get('password')
        const data = Object.fromEntries(formData)
        console.log({data})
        e.currentTarget.reset()
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type='text' name='name' placeholder="Name" />
                <input type='email' name='email' placeholder="Email" />
                <input type='text' name='lastName' placeholder="Last Name" />
                <input type='password' name='password' placeholder="Password" />
                <Button type='submit'>
                    Submit
                </Button>
            </form>
        </div>
    )
}