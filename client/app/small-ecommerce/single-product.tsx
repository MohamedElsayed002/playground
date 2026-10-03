"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAddProductCard } from "@/hooks/use-add-product-card";
import { components } from "@/lib/api/schema";
import { ArrowRight, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useState } from "react";
import { sileo } from "sileo";

type Product = components["schemas"]["ProductListResponse"];

export function LinkButton({ href, label = "View product" }: { href: string; label?: string }) {
  const { pending } = useLinkStatus();

  return (
    <span className="relative inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
      <span className={`transition-opacity duration-200 ${pending ? "opacity-0" : "opacity-100"}`}>
        {label}
      </span>
      <ArrowRight
        size={14}
        className={`shrink-0 transition-all duration-200 ${pending ? "opacity-0" : "opacity-100"}`}
      />

      {pending ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="h-4 w-4" />
        </div>
      ) : null}

      <span className="sr-only">Navigate to {href}</span>
    </span>
  );
}

export const SingleProduct = ({ item }: { item: Product }) => {
  const [now, setNow] = useState<number | null>(null);
  const { mutate, isPending } = useAddProductCard();

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleAddToCart = (productId: number) => {
    mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          sileo.success({
            title: "Product added to cart",
          });
        },
        onError: (error) => {
          sileo.error({
            title: error.message || "Failed to add product to cart",
            description: "Please try again later.",
          });
        },
      },
    );
  };

  const image = item.images?.[0];
  const activeFlashSale =
    now === null
      ? undefined
      : item.flash_sales?.find((sale) => {
          const startsAt = Date.parse(sale.starts_at);
          const endsAt = Date.parse(sale.ends_at);

          return (
            Number.isFinite(startsAt) &&
            Number.isFinite(endsAt) &&
            startsAt <= now &&
            now <= endsAt &&
            sale.remaining_quantity > 0
          );
        });

  const regularPrice = Number(item.price);
  const salePrice = activeFlashSale
    ? regularPrice * (1 - activeFlashSale.discount_percentage / 100)
    : regularPrice;
  const productHref = `/small-ecommerce/${item.slug}`;

  return (
    <article className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_70px_-25px_rgba(15,23,42,0.28)]">
      <div className="relative overflow-hidden">
        <Link href={productHref} aria-label={`View ${item.name}`} className="block">
          {image ? (
            <div className="relative h-64 overflow-hidden bg-slate-100">
              <Image
                src={image.url}
                alt={image.alt_text || item.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center bg-slate-100 text-sm text-slate-500">
              No image available
            </div>
          )}
        </Link>

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {activeFlashSale ? (
            <Link
              href={productHref}
              aria-label={`View ${item.name} flash sale`}
              className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm hover:bg-rose-700"
            >
              {activeFlashSale.discount_percentage}% OFF
            </Link>
          ) : (
            <span />
          )}

          {item.stock_quantity <= 0 && (
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
              Out of stock
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <Link href={productHref} className="block hover:text-violet-700">
            <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
          </Link>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className={`text-2xl font-bold ${activeFlashSale ? "text-rose-600" : "text-slate-900"}`}
              >
                ${salePrice.toFixed(2)}
              </p>
              {activeFlashSale ? (
                <p className="text-sm text-slate-500 line-through">${regularPrice.toFixed(2)}</p>
              ) : item.compare_at_price ? (
                <p className="text-sm text-slate-500 line-through">${item.compare_at_price}</p>
              ) : null}
            </div>

            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {item.stock_quantity} in stock
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={isPending || item.stock_quantity <= 0}
            onClick={() => handleAddToCart(item.id)}
            className="flex-1 rounded-full bg-slate-900 text-white hover:bg-slate-800"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <ShoppingCart size={16} />
              {item.stock_quantity > 0 ? "Add to cart" : "Out of stock"}
            </span>
          </Button>

          <Link href={productHref} aria-label={`View product ${item.name}`} className="inline-flex">
            <LinkButton href={productHref} label="View" />
          </Link>
        </div>
      </div>
    </article>
  );
};
