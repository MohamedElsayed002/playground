import UsersList from "@/components/performance/user-list-tanstack-virtual";
import prisma from "@/lib/db";


export default async function Page() {

    const users = await prisma.user.findMany()

    return (
        <main>
            <UsersList users={users}/>
        </main>
    )
}