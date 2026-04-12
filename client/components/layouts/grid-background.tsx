"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import GridPattern from "@/components/layouts/grid-pattern";

type GridBackgroundProps = React.PropsWithChildren<{
  className?: string;
  patternClassName?: string;
  fadeClassName?: string;
  squares?: [number, number][];
}>;

export default function GridBackground({
  children,
  className,
  patternClassName,
  fadeClassName,
  squares,
}: GridBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <GridPattern
        squares={squares}
        className={cn(
          "opacity-60 mask-[radial-gradient(60%_60%_at_50%_30%,#000_60%,transparent_100%)] dark:opacity-35",
          patternClassName,
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-b from-white/70 via-white/40 to-white dark:from-zinc-950/70 dark:via-zinc-950/50 dark:to-zinc-950",
          fadeClassName,
        )}
      />
      <div className="relative z-1">{children}</div>
    </div>
  );
}
