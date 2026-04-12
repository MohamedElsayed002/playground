import type { Metadata } from "next";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Bad Perofmrance",
};

const fallbackAvatar = "https://placehold.co/80x80/e2e8f0/475569?text=User";

export default async function Page() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      image: true,
      name: true,
      lastName: true,
      bio: true,
    },
  });

  return (
    <main className="container mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">10k Users</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Users Table</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              A heavier, non-virtualized table view for browsing the full user dataset.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            {users.length.toLocaleString()} users loaded
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)]">
        <div className="max-h-[75vh] overflow-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-950 text-left text-sm text-white">
              <tr>
                <th className="w-28 px-6 py-4 font-medium">Image</th>
                <th className="w-64 px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Bio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user, index) => {
                const fullName = [user.name, user.lastName].filter(Boolean).join(" ");

                return (
                  <tr key={user.id} className="align-top transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <img
                        src={user.image || fallbackAvatar}
                        alt={fullName || "User avatar"}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
                        loading="lazy"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{fullName || "Unknown user"}</p>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                          Row {index + 1}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-3xl text-sm leading-6 text-slate-600">
                        {user.bio || "No bio available for this user."}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
