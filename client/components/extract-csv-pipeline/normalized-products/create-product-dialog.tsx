"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Loader2 } from "lucide-react";
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
import { useCreateNormalizedProduct } from "./hooks";
import { ProductFormFields } from "./product-form-fields";
import { buildCreatePayload, toCreateFormValues } from "./helpers";
import type { NormalizedProductFormValues } from "./types";

type CreateNormalizedProductDialogProps = {
  jobId: string;
};

export function CreateNormalizedProductDialog({ jobId }: CreateNormalizedProductDialogProps) {
  const [open, setOpen] = useState(false);
  const createProduct = useCreateNormalizedProduct({ jobId });

  const form = useForm<NormalizedProductFormValues>({
    defaultValues: toCreateFormValues(),
    mode: "onBlur",
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(toCreateFormValues());
      createProduct.reset();
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = buildCreatePayload(values);
      await createProduct.mutateAsync(payload);
      sileo.success({ title: "Product created successfully" });
      handleOpenChange(false);
    } catch (error) {
      sileo.error({
        title: "Create failed",
        description: error instanceof Error ? error.message : "Failed to create product",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add new product
      </Button>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add new normalized product</DialogTitle>
          <DialogDescription>Fill in the details below to create a new report row.</DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <ProductFormFields register={form.register} errors={form.formState.errors} showProductId />

          <DialogFooter>
            <Button type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create product
            </Button>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={createProduct.isPending}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
