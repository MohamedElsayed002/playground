"use client"

import { API_BASE_URL } from "@/lib/api/client"
import { PdfStatusResponse } from "@/types/extract-pdf-pipeline"
import { useQuery } from "@tanstack/react-query"



const statusStyles: Record<string, string> = {
    processing: "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    failed: "bg-rose-100 text-rose-800 border-rose-200",
}

export const PDFStatus = ({ fileId }: { fileId: string }) => {
    const { data, isLoading, error, isFetching } = useQuery<PdfStatusResponse>({
        queryKey: ["extract-pdf-pipeline-status", fileId],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/v1/files/pdf/status/${fileId}`)
            if (!response.ok) {
                throw new Error("Failed to fetch PDF processing status")
            }
            return response.json() as Promise<PdfStatusResponse>
        },
        refetchInterval: (query) => {
            const status = query.state.data?.status
            return status === "processing" ? 2000 : false
        },
    })

    const isComplete = data?.status === "completed"
    const isFailed = data?.status === "failed"
    const result = data?.status === "completed" ? data.result : null

    return (
        <div className="mx-auto max-w-8xl space-y-6 p-6">
            <div className="rounded-2xl border border-orange-200/70 bg-background/90 p-6 shadow-lg shadow-orange-100/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-600">
                            PDF pipeline status
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-foreground">Processing overview</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            This view shows the current upload lifecycle and, when available, the extracted PDF content.
                        </p>
                    </div>

                    <div className={`rounded-full border px-3 py-1 text-sm font-medium ${statusStyles[data?.status ?? "processing"]}`}>
                        {data?.status ?? "loading"}
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
                        <p className="text-sm text-muted-foreground">File ID</p>
                        <p className="mt-1 font-semibold text-foreground">{fileId}</p>
                    </div>
                    <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
                        <p className="text-sm text-muted-foreground">Current state</p>
                        <p className="mt-1 font-semibold text-foreground">{data?.status ?? "Loading..."}</p>
                    </div>
                    <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
                        <p className="text-sm text-muted-foreground">Refresh</p>
                        <p className="mt-1 font-semibold text-foreground">{isFetching ? "Polling..." : "Idle"}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Extracted content</h2>
                        {isComplete && result ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
                                {result.total_pages} page{result.total_pages > 1 ? "s" : ""}
                            </span>
                        ) : null}
                    </div>

                    {isLoading ? (
                        <p className="mt-4 text-sm text-muted-foreground">Loading the latest PDF status...</p>
                    ) : isFailed ? (
                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            {"error" in data ? data.error : "Processing failed."}
                        </div>
                    ) : isComplete && result ? (
                        <div className="mt-4 space-y-5">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-medium text-foreground">Filename</p>
                                <p className="mt-1 text-sm text-muted-foreground">{result.filename}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-medium text-foreground">Preview of extracted text</p>
                                <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                    {result.full_text || "No text was extracted from this document."}
                                </pre>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-medium text-foreground">Structured data</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {result.structured_data
                                        ? "Structured CV data is available in the backend payload."
                                        : "Structured extraction is currently not populated because the LLM step is disabled in this environment."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                           Your PDF is being processed. Please wait a moment.
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">Pipeline steps</h2>
                        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                <span>Upload received and persisted to the backend.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${isComplete ? "bg-emerald-500" : "bg-amber-400"}`} />
                                <span>PDF content is parsed and stored for preview.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-slate-300" />
                                <span>LLM extraction step is currently disabled because it was commented out after budget limits were reached.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">What to expect</h2>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                            While the file is processing, you will see a live status update. Once completed, the page shows the extracted text and a note explaining that structured CV extraction is currently paused until the LLM step is re-enabled.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}