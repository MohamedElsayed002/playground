"use client";

import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JobStatusResponse } from "./types";
import { isJobComplete } from "./utils";

type CompletionPanelProps = {
  job?: JobStatusResponse;
};

export function CompletionPanel({ job }: CompletionPanelProps) {
  const complete = isJobComplete(job);

  return (
    <Card className="border-white/60 bg-gradient-to-r from-slate-950 to-slate-800 text-white shadow-xl shadow-slate-900/20">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <Database className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {complete ? "Your report is ready to explore" : "We'll unlock the report after completion"}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              {complete
                ? "Open the report page to browse the data we extracted from this CSV."
                : "Once processing reaches 100%, we'll show the final analytics and take you straight to the report data."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {complete ? (
            <Button asChild className="bg-amber-500 text-slate-950 hover:bg-amber-400">
              <Link href={`/extract-csv-pipeline/normalized-products/${job?.id ?? ""}`}>
                View report data
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <div className="inline-flex items-center rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70">
              The report data button appears when processing reaches 100%.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
