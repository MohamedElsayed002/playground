"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { sileo } from "sileo";
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
import { Button } from "@/components/ui/button";
import { UpdateNormalizedProductDialog } from "../normalized-products/update-product-dialog";
import { useDeleteNormalizedProduct } from "../normalized-products/hooks";
import type { NormalizedProductDetail } from "../normalized-products/types";

type ProductActionsProps = {
  jobId: string;
  product: NormalizedProductDetail;
};

export function ProductActions({ jobId, product }: ProductActionsProps) {
  const router = useRouter();
  const deleteProduct = useDeleteNormalizedProduct({ jobId, productId: product.id });

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync();
      sileo.success({ title: "Product deleted successfully" });
      router.push(`/extract-csv-pipeline/normalized-products/${jobId}`);
      router.refresh();
    } catch (error) {
      sileo.error({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete product",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <UpdateNormalizedProductDialog jobId={jobId} product={product} triggerLabel="Update" />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              Delete this product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be removed from this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteProduct.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
