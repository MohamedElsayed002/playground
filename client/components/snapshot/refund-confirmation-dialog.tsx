"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRefundRequest, useRefundStatus } from "@/hooks/use-refund";

type RefundConfirmationDialogProps = {
  orderId: number;
  orderTotal: string | number;
};

export default function RefundConfirmationDialog({
  orderId,
  orderTotal,
}: RefundConfirmationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  
  const refundRequest = useRefundRequest();
  const refundStatus = useRefundStatus(orderId, tracking);
  const status = refundStatus.data?.status;

  useEffect(() => {
    if (status === "refunded" || status === "failed" || status === "expired") {
      router.refresh();
    }
  }, [router, status]);

  const handleProceed = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (refundRequest.isPending) return;

    const requestKey = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = requestKey;

    try {
      await refundRequest.mutateAsync({
        orderId,
        idempotencyKey: requestKey,
      });
      setTracking(true);
      setOpen(false);
    } catch {
      // The mutation reports the failure through the shared error toast.
    }
  };

  if (tracking) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-3 rounded-lg border px-3 py-2 text-left text-sm"
      >
        <p className="font-medium">Refund status: {status ?? "processing"}</p>
        {status === "refunded" ? (
          <p className="mt-1 text-emerald-700">Your refund has been completed.</p>
        ) : status === "failed" ? (
          <p className="mt-1 text-red-700">The refund could not be completed. Please contact support.</p>
        ) : status === "expired" ? (
          <p className="mt-1 text-red-700">This refund request has expired. Please contact support.</p>
        ) : refundStatus.isError ? (
          <p className="mt-1 text-gray-600">Status check failed temporarily. Retrying automatically.</p>
        ) : (
          <p className="mt-1 text-gray-600">We are checking with the payment provider every two seconds.</p>
        )}
      </div>
    );
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!refundRequest.isPending) setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          Request refund
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Review the refund terms</AlertDialogTitle>
          <AlertDialogDescription>
            A 20% deduction applies. The refund amount will be 80% of the order total (
            {orderTotal}). Please make sure you want to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={refundRequest.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={refundRequest.isPending}
            onClick={handleProceed}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {refundRequest.isPending ? "Submitting..." : "Proceed"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
