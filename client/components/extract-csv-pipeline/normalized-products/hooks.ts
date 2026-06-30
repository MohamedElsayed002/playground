"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api/client";
import type { NormalizedProductDetail } from "./types";

type MutationParams = {
  jobId: string;
  productId?: string;
};

export function useCreateNormalizedProduct({ jobId }: MutationParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, string | number | null>) => {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      return response.json() as Promise<NormalizedProductDetail>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["normalized-products", jobId] });
    },
  });
}

export function useUpdateNormalizedProduct({ jobId, productId }: MutationParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, string | number | null>) => {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      return response.json() as Promise<NormalizedProductDetail>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["normalized-product", jobId, productId] });
      await queryClient.invalidateQueries({ queryKey: ["normalized-products", jobId] });
    },
  });
}

export function useDeleteNormalizedProduct({ jobId, productId }: MutationParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      return response.json().catch(() => ({ success: true }));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["normalized-products", jobId] });
      await queryClient.invalidateQueries({ queryKey: ["normalized-product", jobId, productId] });
    },
  });
}
