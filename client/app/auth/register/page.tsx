import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { DotPattern } from "@/components/layouts/dot-pattern";

export const metadata: Metadata = {
    title: 'Register',
    description:'Register user'
}


export default function RegisterPage() {
    return (
        <DotPattern
        className='min-h-screen bg-[radial-gradient(circle_at_top,_#065f46_0%,_#022c22_40%,_#020617_100%)]'
      >
        <RegisterForm/>
        </DotPattern>
    )
}