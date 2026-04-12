import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth.actions";
import { RoomList } from "@/components/chat/room-list";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <RoomList />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
