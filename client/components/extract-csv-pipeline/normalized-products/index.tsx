"use client";

import { useEffect, useMemo, useState } from "react";
import { useNormalizedProducts } from "@/hooks/use-normalized-products";
import { PageShell } from "../shared/page-shell";
import { NormalizedProductsDataTable } from "./data-table";
import { createNormalizedProductColumns } from "./columns";
import { useNormalizedProductsSearchParams } from "./search-params";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NormalizedProductsViewProps = {
  jobId: string;
};

export default function NormalizedProductsView({ jobId }: NormalizedProductsViewProps) {
  const [searchParams] = useNormalizedProductsSearchParams();
  const [debouncedParams, setDebouncedParams] = useState(searchParams);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedParams(searchParams);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  const isDebouncing =
    debouncedParams.product_name !== searchParams.product_name ||
    debouncedParams.category !== searchParams.category ||
    debouncedParams.pageIndex !== searchParams.pageIndex ||
    debouncedParams.pageSize !== searchParams.pageSize ||
    debouncedParams.sort_by !== searchParams.sort_by ||
    debouncedParams.sort_order !== searchParams.sort_order;

  const { data, isLoading, error } = useNormalizedProducts({
    jobId,
    limit: debouncedParams.pageSize,
    offset: debouncedParams.pageIndex * debouncedParams.pageSize,
    productName: debouncedParams.product_name || undefined,
    category: debouncedParams.category || undefined,
    sortBy: debouncedParams.sort_by,
    sortOrder: debouncedParams.sort_order,
  });

  const products = data?.products ?? [];
  const totalItems = data?.total ?? 0;
  const pageCount = Math.max(Math.ceil(totalItems / debouncedParams.pageSize), 1);
  const columns = useMemo(() => createNormalizedProductColumns(jobId), [jobId]);

  return (
    <PageShell
      title="Normalized Products"
      description="Browse, filter, and sort products extracted from your CSV ingestion job."
      breadcrumbs={[
        { label: "Extract CSV Pipeline", href: "/extract-csv-pipeline" },
        { label: "Normalized Products" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Job ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all font-mono text-sm">{jobId}</p>
          </CardContent>
        </Card>
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          Failed to load normalized products. Please try again.
        </div>
      ) : (
        <NormalizedProductsDataTable
          columns={columns}
          data={products}
          pageCount={pageCount}
          totalItems={totalItems}
          isLoading={isLoading || isDebouncing}
        />
      )}
    </PageShell>
  );
}
