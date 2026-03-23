import prisma from "@/lib/db"

export const Users = async () => {

    const users = await prisma.users.findMany()

    return (
        <div>
            {JSON.stringify(users,null,2)}
        </div>
    )
}
