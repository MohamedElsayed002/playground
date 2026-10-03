import { api } from "@/lib/api/client";
import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { ProductsGrid } from "./products-grid";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Small E-commerce",
  description: "Mohamed Elsayed",
};

export default async function Page() {
  const accessToken = (await cookies()).get("fastapi_access")?.value;
  const data = await api.GET("/api/v1/products");

  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700">
              <Sparkles size={12} />
              Curated catalog
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Shop smarter.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Discover what fits your lifestyle with quick product insights, smart
                recommendations, and a smoother shopping flow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={accessToken ? "/small-ecommerce/cart" : "/auth/login-fastapi"}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <ShoppingBag size={16} />
              User Cart
            </Link>
            <Link
              href={accessToken ? "/small-ecommerce/snapshot" : "/auth/login-fastapi"}
              className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
            >
              <TrendingUp size={16} />
              Snapshot
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Storefront</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Featured products
              <span className="ml-2 text-base font-medium text-slate-500">
                ({data.data?.items.length ?? 0})
              </span>
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            In stock and ready to ship
          </div>
        </div>

        <div className="mt-6">
          <ProductsGrid products={data.data?.items || []} />
        </div>
      </section>
    </main>
  );
}
