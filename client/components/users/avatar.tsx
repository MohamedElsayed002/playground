"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

const dotSizes = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

export function Avatar({ username, avatarUrl, isOnline, size = "md" }: AvatarProps) {
  return (
    <div className="relative flex shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className={cn("rounded-full object-cover", sizes[size])}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold text-white select-none",
            sizes[size],
            letterColor(username),
          )}
        >
          {username[0]?.toUpperCase()}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            dotSizes[size],
            isOnline ? "bg-green-500" : "bg-gray-300",
          )}
        />
      )}
    </div>
  );
}

function letterColor(name: string): string {
  const colours = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  return colours[(name.charCodeAt(0) ?? 0) % colours.length];
}
