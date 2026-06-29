import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Breadcrumb = {
  label: string;
  href?: string;
};

type PageShellProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PageShell({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <main
      className={cn(
        "min-h-screen bg-[radial-gradient(circle_at_top,_#fed7aa_0%,_#ffedd5_35%,_#fefce8_75%,_#fafaf9_100%)]",
        className,
      )}
    >
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10 md:py-12">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="font-medium text-foreground/80 hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                  {!isLast ? <ChevronRight className="size-4" /> : null}
                </span>
              );
            })}
          </nav>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>

        {children}
      </div>
    </main>
  );
}
