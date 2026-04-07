"use client"

import { useAuthStore } from "@/store/auth.store"
import { Button } from "../ui/button"
import Link from "next/link"
import { useLogout } from "@/hooks/use-auth"
import { DoorOpen } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"
export function UserBadge() {
    const profile = useAuthStore(state => state.profile)
    const userLogout = useLogout()

    if(!profile) return <Button asChild><Link href="/auth/login">Login</Link></Button>
    return (
        <div className="flex items-center gap-3">
            <h1 className="italic text-3xl mt-2">Hello, {profile?.username}</h1>
            <HoverCard>
                <HoverCardTrigger onClick={() => userLogout.mutate()}><DoorOpen/></HoverCardTrigger>
                <HoverCardContent>
                    Logout, I'll miss you 
                </HoverCardContent>
            </HoverCard>
        </div>
    )
}