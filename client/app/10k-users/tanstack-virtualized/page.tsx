import UsersList from "@/components/performance/user-list-tanstack-virtual";
import prisma from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'tanstack-virtualized'
}

export default async function Page() {

    const users = await prisma.user.findMany()

    return (
        <main>
            <UsersList users={users}/>
        </main>
    )
}