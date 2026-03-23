import prisma from "@/lib/db"

export default async  function Test() {

    const users = await prisma.users.findMany()
    return (
        <div>
            {JSON.stringify(users,null,2)}
        </div>
    )
}