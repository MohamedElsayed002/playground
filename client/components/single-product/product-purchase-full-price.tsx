"use client";

import { Button } from "@/components/ui/button";

interface ProductPurchaseFullPriceProps {
  disabled: boolean;
  loadingAddToCart: boolean;
  isCheckingRedemption: boolean;
  onAddToCart: () => void;
}

export function ProductPurchaseFullPrice({
  disabled,
  loadingAddToCart,
  isCheckingRedemption,
  onAddToCart,
}: ProductPurchaseFullPriceProps) {
  return (
    <div className="mt-5 space-y-3">
      <Button
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
        disabled={disabled || loadingAddToCart}
        onClick={onAddToCart}
      >
        {isCheckingRedemption
          ? "Checking discount eligibility..."
          : loadingAddToCart
            ? "Adding to cart..."
            : "Pay full price"}
      </Button>

      <p className="text-center text-xs text-slate-500">
        No active flash sale is available for this product.
      </p>
    </div>
  );
}
