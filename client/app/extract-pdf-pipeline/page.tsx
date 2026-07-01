import { Metadata } from "next"
import { ExtractPdfPipeline } from "@/components/extract-pdf-pipeline";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Extract PDF Pipeline",
    description: ":DDDDDDDDDDDDDD"
}

export default function Page() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.12),_transparent_45%)] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="rounded-3xl border border-orange-200/70 bg-background/85 p-6 shadow-lg shadow-orange-100/40 backdrop-blur-sm sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">
                                Extract PDF pipeline
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                Upload a PDF and follow the extraction lifecycle
                            </h1>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                                This experience walks the file from upload to text extraction and lets you review the results in a clear status page.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm text-orange-700">
                            Secure upload • Background processing • Review results
                        </div>
                    </div>
                </header>
                <Suspense fallback={<h1>Loading</h1>}>
                    <ExtractPdfPipeline />
                </Suspense>
            </div>
        </div>
    )
}