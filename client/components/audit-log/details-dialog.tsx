"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AuditLogItem } from "@/types/audit-log";

interface AuditLogDetailsDialogProps {
  log: AuditLogItem;
}

export function AuditLogDetailsDialog({ log }: AuditLogDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const extraData = log.extra ?? {};

  useEffect(() => {
    if (!open) return;

    const handleOutsideMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!contentRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideMouseDown);
    };
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        ref={contentRef}
        className="max-w-2xl max-h-[85vh] border-white/10 bg-zinc-950 text-white"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Audit Log Details</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-white/60">Event</span>
            <span className="font-medium">{log.event}</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-white/60">Status</span>
            <span className="font-medium">{log.status}</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-white/60">User ID</span>
            <span className="font-medium">{log.user_id ?? "System"}</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-white/60">Created</span>
            <span className="font-medium">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">Extra Payload</p>
          <pre className="max-h-[320px] overflow-auto rounded-md border border-white/10 bg-black/40 p-4 text-xs text-white/90">
            {JSON.stringify(extraData, null, 2)}
          </pre>
        </div>

        <div className="flex justify-end">
          <AlertDialogCancel className="bg-white/5 border-white/15 text-white hover:bg-white/10">
            Close
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
