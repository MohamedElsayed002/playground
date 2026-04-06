"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { FixedSizeList as List } from "react-window";

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

  const router = useRouter()

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }) => {


    useHotkey('Control+Space', () => {
      router.push('/')
    })

    const user = users[index];
    const fullName = [user.name, user.lastName].filter(Boolean).join(" ");

    return (
      <div style={{ ...style, padding: "12px 16px" }}>
        <article className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-colors hover:bg-slate-50">
          <img
            src={user.image || fallbackAvatar}
            alt={fullName || "User avatar"}
            loading="lazy"
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {fullName || "Unknown user"}
                </h3>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Virtual row {index + 1}
                </p>
              </div>
            </div>

            <p className="line-clamp-2 text-sm leading-6 text-slate-600">
              {user.bio || "No bio available for this user."}
            </p>
          </div>
        </article>
      </div>
    );
  };


  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">

      <span onClick={() => router.push('/')} className="flex gap-4 cursor-pointer">
        <ArrowLeft size={20} />
        Back / Ctrl+Space
      </span>

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
          10k Users
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              React Window List
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              A virtualized list that keeps scrolling smooth while still showing
              richer profile cards.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            {users.length.toLocaleString()} users loaded
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)]">
        <div className="border-b border-slate-200 bg-slate-950 px-6 py-4 text-sm text-white">
          Browse users with a fixed-size virtual window.
        </div>

        <List
          height={900}
          itemCount={users.length}
          itemSize={120}
          width="100%"
          className="bg-slate-100/70"
        >
          {Row}
        </List>
      </div>
    </section>
  );
}
