"use client";

import { useUsers } from "@/hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default function UsersTable() {
  const { data: usersData, isLoading, error } = useUsers();

  const usersList = usersData?.allUsers?.users ?? [];
  const errorMessage = error instanceof Error ? error.message : "Error";

  return (
    <div className="container mx-auto p-10 my-20">
      <h1 className="text-4xl font-bold italic">Tanstack Table/ GraphQL/ Sileo</h1>
      <p className="text-gray-400 italic">all users from fakerjs</p>

      {/* Better Performance LCP/CLS */}
      {isLoading ? (
        <div className="container mx-auto my-10">
          <Skeleton className="w-full bg-gray-200 h-[600px]" />
        </div>
      ) : error ? (
        <h1>{errorMessage}</h1>
      ) : usersList.length > 0 ? (
        <DataTable columns={columns} data={usersList} />
      ) : (
        <h1>No users found</h1>
      )}
    </div>
  );
}
