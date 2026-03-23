'use client'

import { useSingleUser } from "@/hooks/use-users"
import { useParams } from "next/navigation"
import { Skeleton } from "../ui/skeleton"


export default function SingleUser() {
    const params = useParams<{ userId: string }>()
    const { data: user, isLoading, error } = useSingleUser(params.userId)

    if (isLoading) {
        return (
            <div className='max-w-7xl mx-auto my-20'>
                <Skeleton className="w-[800px] bg-gray-200 h-[600px]" />
            </div>
        )
    }

    if (error || !user?.SingleUserFake) {
        return (
            <h1>No Users Available</h1>
        )
    }
    return (
        <div className="max-w-7xl mx-auto my-20">
            <img src={user.SingleUserFake.image} className="rounded-full" width={400} height={400} />
            <div className="mt-4">
                <h1>Name: {user.SingleUserFake.name} {user.SingleUserFake.lastName}</h1>
                <h2>Gender {user.SingleUserFake.sex}</h2>
                <h2>Phone number {user.SingleUserFake.phoneNumber}</h2>
            </div>
        </div>
    )
}
