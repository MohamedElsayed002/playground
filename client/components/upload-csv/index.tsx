"use client";

import { useCallback, useRef, useState } from "react";
import {
  FileSpreadsheet,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  createIdempotencyKeyForFile,
  formatFileSize,
} from "@/lib/csv-upload";
import { useCsvUpload } from "@/hooks/use-csv-upload";
import { useQuery } from "@tanstack/react-query";

const steps = [
  { step: "1", title: "Select file", text: "Choose or drop a CSV inventory file." },
  { step: "2", title: "Safe upload", text: "Idempotency prevents duplicate jobs on retry." },
  { step: "3", title: "Track progress", text: "Monitor ingestion from the jobs dashboard." },
]


export function UploadFile() {

  const inputRef = useRef<HTMLInputElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const selectedFileRef = useRef<File | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutateAsync, isPending, reset: resetMutation } = useCsvUpload();

  const assignFile = useCallback((file: File | undefined | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setValidationError("Only CSV files are allowed.");
      return;
    }

    setValidationError(null);
    resetMutation();
    setSelectedFile(file);
  }, [resetMutation]);

  const clearFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    selectedFileRef.current = null;
    idempotencyKeyRef.current = null;
    setIdempotencyKey(null);
    resetMutation();
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile || isPending) return;

    const key = idempotencyKeyRef.current ?? idempotencyKey;
    if (!key) {
      const nextKey = createIdempotencyKeyForFile();
      idempotencyKeyRef.current = nextKey;
      setIdempotencyKey(nextKey);
    }

    const activeKey = idempotencyKeyRef.current!;

    try {
      const response = await mutateAsync({
        file: selectedFile,
        idempotencyKey: activeKey,
      });
      const result = response.data;
      if(result.status === "completed") {
        sileo.success({
          title: "Processing file finished",
          description: "Go and check it"
        })
        return
      }

      if (response.status === 202 || result.status === "processing") {
        sileo.info({
          title: "Upload already in progress",
          description: result.message ?? "This file is already being processed with the same idempotency key.",
        });
        return;
      }


      sileo.success({
        title: "Upload started",
        description: result.job_id ? `Job is processing.` : result.message ?? "Your CSV is being processed.",
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file";
      console.log(error)
      sileo.error({ title: "Upload failed", description: message });
    }

  };


  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    assignFile(event.dataTransfer.files?.[0]);
  };


  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card className="overflow-hidden border-orange-200/60 bg-background/90 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-r from-orange-50/80 to-amber-50/40">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-600">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Upload CSV File</CardTitle>
              <CardDescription className="mt-1 max-w-lg">
                Drop your inventory CSV here. The same idempotency key is reused for retries so duplicate
                uploads are safely ignored.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => assignFile(event.target.files?.[0])}
          />

            <>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    inputRef.current?.click();
                  }
                }}
                onClick={() => inputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all",
                  isDragging
                    ? "border-orange-500 bg-orange-50/70"
                    : "border-orange-200/80 bg-orange-50/30 hover:border-orange-400 hover:bg-orange-50/50",
                )}
              >
                <div className="rounded-full bg-background p-4 shadow-sm ring-1 ring-orange-100">
                  <FileSpreadsheet className="size-8 text-orange-600" />
                </div>
                <p className="mt-4 text-lg font-semibold">Drag & drop your CSV here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse files</p>
                <p className="mt-3 text-xs text-muted-foreground">Accepted format: .csv</p>
              </div>

              {validationError ? (
                <p className="text-sm text-destructive">{validationError}</p>
              ) : null}

              {selectedFile ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700">
                      <FileSpreadsheet className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={clearFile} disabled={isPending}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : null}

              {idempotencyKey ? (
                <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Idempotency key locked for this file</p>
                        <p className="text-xs text-blue-700/80">
                          Retries and double-clicks reuse this key. Change the file to generate a new one.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Upload triggers validation, normalization, and database ingestion.
                </p>
                <Button
                  type="button"
                  size="lg"
                  disabled={!selectedFile || isPending}
                  onClick={handleUpload}
                  className="min-w-[160px]"
                >
                  {isPending ? (
                    <>
                      <Spinner className="size-4" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-4" />
                      Start upload
                    </>
                  )}
                </Button>
              </div>
            </>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((item) => (
          <div key={item.step} className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <Badge variant="secondary" className="mb-2">
              Step {item.step}
            </Badge>
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
