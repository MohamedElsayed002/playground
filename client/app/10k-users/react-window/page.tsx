import UsersList from "@/components/performance/user-list-react-window";
import prisma from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "react-window",
};

export default async function Page() {
  const users = await prisma.user.findMany();

  return (
    <main>
      <UsersList users={users} />
    </main>
  );
}
