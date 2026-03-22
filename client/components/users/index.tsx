'use client'

import { useUsers } from "@/hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default function Users() {
    const { data: users, isLoading, error} = useUsers()

    if(isLoading) {
        return (
            <div className='max-w-7xl mx-auto my-20'>
                <Skeleton className="w-[800px] bg-gray-200 h-[600px]"/>
            </div>
        )
    }

    if(error || !users || users.allUsers.users.length === 0) {
        return (
            <h1>No Users Available</h1>
        )
    }


    return (
        <div className="min-w-7xl mx-auto my-20">
            <DataTable columns={columns} data={users.allUsers.users}/>
        </div>
    )

}