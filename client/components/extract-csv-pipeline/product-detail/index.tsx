"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNormalizedProduct } from "@/hooks/use-normalized-product";
import { PageShell } from "../shared/page-shell";

type ProductDetailViewProps = {
  jobId: string;
  productId: string;
};

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-base">{value}</div>
    </div>
  );
}

export default function ProductDetailView({ jobId, productId }: ProductDetailViewProps) {
  const { data: product, isLoading, error } = useNormalizedProduct({ jobId, productId });

  const formattedPrice = product
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(Number(product.price))
    : null;

  return (
    <PageShell
      title="Product Details"
      description="View normalized product data saved from your CSV extraction job."
      breadcrumbs={[
        { label: "Extract CSV Pipeline", href: "/extract-csv-pipeline" },
        { label: "Normalized Products", href: `/extract-csv-pipeline/normalized-products/${jobId}` },
        { label: product?.product_name ?? "Product" },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/extract-csv-pipeline/normalized-products/${jobId}`}>
            <ArrowLeft className="size-4" />
            Back to products
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </CardContent>
        </Card>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          Failed to load product details. Please try again.
        </div>
      ) : product ? (
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader className="border-b">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Package className="size-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">{product.product_name}</CardTitle>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{product.product_id}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
            <DetailItem label="Category" value={product.category || "—"} />
            <DetailItem label="Price" value={formattedPrice} />
            <DetailItem label="Quantity" value={product.quantity} />
            <DetailItem
              label="Last Restock Date"
              value={
                product.last_restock_date
                  ? format(new Date(product.last_restock_date), "PPP")
                  : "—"
              }
            />
            <DetailItem label="Internal ID" value={<span className="font-mono text-sm">{product.id}</span>} />
            <DetailItem label="Job ID" value={<span className="break-all font-mono text-sm">{product.job_id}</span>} />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-background/80 p-6 text-muted-foreground">
          Product not found.
        </div>
      )}
    </PageShell>
  );
}
