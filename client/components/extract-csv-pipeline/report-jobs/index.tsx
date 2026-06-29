"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportJobs } from "@/hooks/use-report-jobs";
import { PageShell } from "../shared/page-shell";
import { ReportJobsDataTable } from "./data-table";
import { reportJobColumns } from "./columns";
import { useReportJobsSearchParams } from "./search-params";

export default function ReportJobsView() {
  const [searchParams] = useReportJobsSearchParams();

  const { data, isLoading, error } = useReportJobs({
    limit: searchParams.pageSize,
    offset: searchParams.pageIndex * searchParams.pageSize,
  });

  const jobs = data?.jobs ?? [];
  const totalItems = data?.total_jobs ?? 0;
  const pageCount = Math.max(Math.ceil(totalItems / searchParams.pageSize), 1);

  return (
    <PageShell
      title="CSV Extraction Jobs"
      description="Review uploaded CSV files, track ingestion progress, and browse normalized product data."
      breadcrumbs={[{ label: "Extract CSV Pipeline" }]}
      actions={
        <Button asChild>
          <Link href="/extract-csv-pipeline/upload">
            <Upload className="size-4" />
            Upload CSV
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">On This Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{jobs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">User ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-gray-500">
              I hard coded the userId
            </p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          Failed to load report jobs. Please try again.
        </div>
      ) : (
        <ReportJobsDataTable
          columns={reportJobColumns}
          data={jobs}
          pageCount={pageCount}
          totalItems={totalItems}
          isLoading={isLoading}
        />
      )}
    </PageShell>
  );
}
