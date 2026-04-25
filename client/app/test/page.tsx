"use client";

import Image from "next/image";
import { debounce } from "nuqs";
import { useProductQueryParams } from "./use-product-query-params";
import { useProducts } from "./use-products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export default function Page() {
  const [query, setQuery] = useProductQueryParams();
  const { data, error } = useProducts(query);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Products Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Search and filter products while keeping state in URL params.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              value={query.search}
              placeholder="Search by name..."
              onChange={(e) =>
                setQuery(
                  { search: e.target.value, page: 1 },
                  { limitUrlUpdates: e.target.value === "" ? undefined : debounce(500) },
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category ID</Label>
            <Input
              id="category"
              type="number"
              value={query.category_id}
              onChange={(e) => setQuery({ category_id: Number(e.target.value || 0), page: 1 })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page">Page</Label>
            <Input
              id="page"
              type="number"
              value={query.page}
              onChange={(e) => setQuery({ page: Math.max(1, Number(e.target.value || 1)) })}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_size">Page Size</Label>
            <Input
              id="page_size"
              type="number"
              value={query.page_size}
              onChange={(e) =>
                setQuery({ page_size: Math.max(1, Number(e.target.value || 10)), page: 1 })
              }
              placeholder="10"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={query.featured}
              onChange={(e) => setQuery({ featured: e.target.checked, page: 1 })}
              className="h-4 w-4 rounded border-input"
            />
            Featured only
          </Label>
          <Button
            variant="outline"
            onClick={() =>
              setQuery({
                search: "",
                category_id: 0,
                featured: false,
                page: 1,
                page_size: 10,
              })
            }
          >
            Reset Filters
          </Button>
          <p className="text-sm text-muted-foreground">
            Hello, {query.search || "Anonymous visitor"}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {data?.items.length ?? 0} item(s)</p>
        <p className="text-sm text-muted-foreground">
          Page size: {data?.page_size ?? query.page_size}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="relative aspect-4/3 w-full bg-muted">
              {item.images[0] ? (
                <Image
                  src={item.images[0].url}
                  alt={item.images[0].alt_text ?? item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <h2 className="line-clamp-1 text-lg font-medium">{item.name}</h2>
              <p className="text-xs text-muted-foreground">ID: {item.id}</p>
              {query.featured && (
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                  Featured
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {!data?.items.length && !error && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No products found for current filters.
        </div>
      )}
    </div>
  );
}
