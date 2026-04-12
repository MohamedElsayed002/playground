"use client";

import { useSingleUser } from "@/hooks/use-users";
import { useParams } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";

export default function SingleUser({ userId }: { userId: string }) {
  // const params = useParams<{ userId: string }>()
  const { data: user, isLoading, error, refetch } = useSingleUser(userId);
  const userData = user?.SingleUserFake;
  return (
    <div className="container mx-auto my-20">
      <h1 className="text-4xl font-bold italic text-center md:text-left underline mb-4">
        User Info
      </h1>
      <div className="flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="mx-auto h-72 w-72 rounded-full bg-gray-200" />
            <Skeleton className="h-5 w-3/4 bg-gray-200" />
            <Skeleton className="h-5 w-1/2 bg-gray-200" />
            <Skeleton className="h-5 w-2/3 bg-gray-200" />
          </div>
        ) : error ? (
          <div className="w-full max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-700">Could not load user</h2>
            <Button className="mt-4" variant="destructive" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : !userData ? (
          <div className="w-full max-w-md rounded-lg border bg-white/80 p-6 text-center">
            <h2 className="text-lg font-semibold">User not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The requested user does not exist or was removed.
            </p>
          </div>
        ) : (
          <>
            <img
              src={userData.image}
              alt={`${userData.name} ${userData.lastName}`}
              className="h-[320px] w-[320px] rounded-full object-cover"
              width={400}
              height={400}
            />
            <div className="mt-4 space-y-1 text-center md:text-left">
              <h2 className="text-xl font-semibold">
                {userData.name} {userData.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">Gender: {userData.sex}</p>
              <p className="text-sm text-muted-foreground">Phone: {userData.phoneNumber}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
