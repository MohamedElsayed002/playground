"use client"

import { useAuthStore } from "@/store/auth.store"
import { Button } from "../ui/button"
import Link from "next/link"
import { useLogout } from "@/hooks/use-auth"
import { DoorOpen } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"
import Image from "next/image"
import { API_URL } from "@/lib/api"

function signInWithGoogle() {
    window.location.href = `${API_URL}/auth/google`;
}

export function UserBadge() {
    const profile = useAuthStore(state => state.profile)
    const userLogout = useLogout()

    if (!profile) return (
        <div className="flex mt-4 gap-3 ">
            <Button asChild><Link href="/auth/login">Login</Link></Button>
            <Button
                variant="secondary"
                className="flex items-center gap-2"
                type="button"
                onClick={signInWithGoogle}
            >
                <Image
                    src="/providers/google.svg"
                    width={20}
                    priority
                    height={20}
                    alt="Google"
                />
                Continue with Google
            </Button>
        </div>
    )
    return (
        <div className="flex items-center gap-3">
            <h1 className="italic text-3xl mt-2">Hello, {profile?.username}</h1>
            <HoverCard>
                <HoverCardTrigger onClick={() => userLogout.mutate()}><DoorOpen /></HoverCardTrigger>
                <HoverCardContent>
                    Logout, I&apos;ll miss you
                </HoverCardContent>
            </HoverCard>
        </div>
    )
}