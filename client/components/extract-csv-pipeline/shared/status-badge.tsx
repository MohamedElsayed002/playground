import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

function getStatusVariant(status: string) {
  const normalized = status.toLowerCase();

  if (["completed", "success", "done", "ingested"].includes(normalized)) {
    return "success";
  }

  if (["failed", "error", "invalid"].includes(normalized)) {
    return "error";
  }

  if (["processing", "running", "pending", "in_progress"].includes(normalized)) {
    return "pending";
  }

  return "neutral";
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = getStatusVariant(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        variant === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        variant === "error" && "border-red-500/30 bg-red-500/10 text-red-700",
        variant === "pending" && "border-amber-500/30 bg-amber-500/10 text-amber-700",
        variant === "neutral" && "border-border bg-background text-foreground",
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
