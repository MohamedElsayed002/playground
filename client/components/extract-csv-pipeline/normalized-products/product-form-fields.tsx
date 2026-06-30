"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NormalizedProductFormValues } from "./types";

type ProductFormFieldsProps = {
  register: UseFormRegister<NormalizedProductFormValues>;
  errors: FieldErrors<NormalizedProductFormValues>;
  showProductId?: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function FieldShell({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function ProductFormFields({ register, errors, showProductId = false }: ProductFormFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {showProductId ? (
        <FieldShell label="Product ID" error={errors.product_id?.message}>
          <Input
            placeholder="SKU-001"
            {...register("product_id", {
              required: "Product ID is required",
              minLength: { value: 1, message: "Product ID is required" },
              maxLength: { value: 100, message: "Max 100 characters" },
            })}
          />
        </FieldShell>
      ) : null}

      <FieldShell label="Product name" error={errors.product_name?.message}>
        <Input
          placeholder="Product name"
          {...register("product_name", {
            required: "Product name is required",
            minLength: { value: 2, message: "Min 2 characters" },
            maxLength: { value: 255, message: "Max 255 characters" },
          })}
        />
      </FieldShell>

      <FieldShell label="Category" error={errors.category?.message}>
        <Input
          placeholder="Category"
          {...register("category", {
            maxLength: { value: 100, message: "Max 100 characters" },
          })}
        />
      </FieldShell>

      <FieldShell label="Price" error={errors.price?.message}>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("price", {
            required: "Price is required",
            validate: (value) => {
              const numericValue = Number(value);
              if (!Number.isFinite(numericValue) || numericValue <= 0) {
                return "Price must be greater than 0";
              }

              return true;
            },
          })}
        />
      </FieldShell>

      <FieldShell label="Quantity" error={errors.quantity?.message}>
        <Input
          type="number"
          step="1"
          placeholder="0"
          {...register("quantity", {
            required: "Quantity is required",
            validate: (value) => {
              const numericValue = Number(value);
              if (!Number.isInteger(numericValue) || numericValue < 0) {
                return "Quantity must be a whole number";
              }

              return true;
            },
          })}
        />
      </FieldShell>

      <FieldShell label="Last restock date" error={errors.last_restock_date?.message}>
        <Input type="date" {...register("last_restock_date")} />
      </FieldShell>
    </div>
  );
}
