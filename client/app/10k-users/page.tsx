import UsersList from "@/components/performance/user-list-tanstack-virtual"
import prisma from "@/lib/db"
// import UsersList from "@/components/performance/user-list-react-window"


export default async function Page() {
    const users = await prisma.user.findMany({
        select: {
            image: true,
            name: true,
            lastName: true,
            bio: true
        }
    })

    if(!users) return <h1>No Users</h1>
    
    return (
        <div>
            <h1>Users</h1>
            <UsersList users={users ?? []} />
        </div>
    )
}