"use client";

import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  showLabel?: boolean;
  className?: string;
}

export function OnlineIndicator({ isOnline, showLabel = true, className }: OnlineIndicatorProps) {
  return (
    <span className={cn("flex items-center gap-1.5 text-xs", className)}>
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full",
          isOnline ? "bg-green-500" : "bg-gray-300",
        )}
      />

      {showLabel && (
        <span className={isOnline ? "text-green-600" : "text-gray-400"}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </span>
  );
}
