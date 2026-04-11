"use client";

import { ProgressBar, ProgressBarProvider } from "react-transition-progress";

/** Same API as next/link; use this when you want the top progress bar on navigation. */
export { Link } from "react-transition-progress/next";

export function TransitionProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgressBarProvider>
      <ProgressBar className="fixed top-0 left-0 z-100 h-3 w-full origin-left bg-sky-500/20 shadow-lg shadow-sky-500/20" />
      {children}
    </ProgressBarProvider>
  );
}
