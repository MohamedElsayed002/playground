"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, PencilLine } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateNormalizedProduct } from "./hooks";
import { ProductFormFields } from "./product-form-fields";
import { buildUpdatePayload, toEditFormValues } from "./helpers";
import type { NormalizedProductDetail, NormalizedProductFormValues } from "./types";

type UpdateNormalizedProductDialogProps = {
  jobId: string;
  product: NormalizedProductDetail;
  onUpdated?: () => void;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
};

export function UpdateNormalizedProductDialog({
  jobId,
  product,
  onUpdated,
  triggerLabel = "Update",
  triggerVariant = "outline",
}: UpdateNormalizedProductDialogProps) {
  const [open, setOpen] = useState(false);
  const updateProduct = useUpdateNormalizedProduct({ jobId, productId: product.id });
  const { mutateAsync, isPending, reset: resetUpdateProduct } = updateProduct;

  const form = useForm<NormalizedProductFormValues>({
    defaultValues: toEditFormValues(product),
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) {
      form.reset(toEditFormValues(product));
      resetUpdateProduct();
    }
  }, [form, open, product, resetUpdateProduct]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetUpdateProduct();
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = buildUpdatePayload(product, values);

      if (Object.keys(payload).length === 0) {
        return;
      }

      await mutateAsync(payload);
      sileo.success({ title: "Product updated successfully" });
      handleOpenChange(false);
      onUpdated?.();
    } catch (error) {
      sileo.error({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update product",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" variant={triggerVariant} size="sm" onClick={() => setOpen(true)}>
        <PencilLine className="size-4" />
        {triggerLabel}
      </Button>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
          <DialogDescription>Update the necessary fields without leaving this page.</DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <ProductFormFields register={form.register} errors={form.formState.errors} />

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
