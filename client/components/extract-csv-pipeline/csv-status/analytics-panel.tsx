"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JobStatusResponse } from "./types";
import { buildAnalytics, isJobComplete } from "./utils";

export function AnalyticsPanel({ job }: { job?: JobStatusResponse }) {
  const complete = isJobComplete(job);
  const analytics = buildAnalytics(job);

  return (
    <Card className="border-white/60 bg-white/80 shadow-xl shadow-amber-100/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="size-5 text-amber-600" />
          Report analytics
        </CardTitle>
        <CardDescription>These are the metrics the user can review before opening the report data.</CardDescription>
      </CardHeader>
      <CardContent>
        {complete ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {analytics.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-muted-foreground">
            Your analytics will appear here once the report reaches 100%.
          </div>
        )}

        {job?.failure_reason ? (
          <>
            <Separator className="my-6" />
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Processing stopped</p>
              <p className="mt-1">{job.failure_reason}</p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
