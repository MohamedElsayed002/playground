"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type User = {
  image: string | null;
  name: string;
  lastName: string;
  bio: string | null;
};

type UsersListProps = {
  users: User[];
};

const fallbackAvatar =
  "https://placehold.co/80x80/e2e8f0/475569?text=User";

export default function UsersList({ users }: UsersListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 6,
  });

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
          10k Users
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              TanStack Virtual List
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              A virtualized scroll region with richer profile cards and minimal
              rendering cost.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            {users.length.toLocaleString()} users loaded
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)]">
        <div className="border-b border-slate-200 bg-slate-950 px-6 py-4 text-sm text-white">
          Browse users with TanStack Virtual.
        </div>

        <div
          ref={parentRef}
          className="h-[900px] overflow-auto bg-slate-100/70"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const user = users[virtualRow.index];
              const fullName = [user.name, user.lastName]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={`${fullName}-${virtualRow.index}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: "12px 16px",
                  }}
                >
                  <article className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-colors hover:bg-slate-50">
                    <img
                      loading="lazy"
                      src={user.image || fallbackAvatar}
                      alt={fullName || "User avatar"}
                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
                    />

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {fullName || "Unknown user"}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                            Virtual row {virtualRow.index + 1}
                          </p>
                        </div>

                        <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          TanStack Virtual
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                        {user.bio || "No bio available for this user."}
                      </p>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
