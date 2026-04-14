"use client";

import Link from "next/link";
import { useState } from "react";

type HoverPrefetchLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function HoverPrefetchLink({ href, children, className, ariaLabel }: HoverPrefetchLinkProps) {
  const [active, setActive] = useState(false);

  return (
    <Link
      href={href}
      prefetch={active}
      className={className}
      aria-label={ariaLabel}
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  );
}
