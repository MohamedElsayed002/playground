import { PDFStatus } from "@/components/extract-pdf-pipeline/pdf-status"
import { Suspense } from "react"

interface PageProps {
    params: Promise<{ fileId: string }>
}

export default async function Page({ params }: PageProps) {
    const { fileId } = await params

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.12),_transparent_45%)] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="rounded-3xl border border-orange-200/70 bg-background/85 p-6 shadow-lg shadow-orange-100/40 backdrop-blur-sm sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">
                                PDF processing status
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                Track the extraction progress for this document
                            </h1>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                                Follow the current pipeline state and inspect the extracted content once the PDF has finished processing.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm text-orange-700">
                            Live polling • Extracted preview • Pipeline insights
                        </div>
                    </div>
                </header>
                <Suspense fallback={<h1>Loading..</h1>}>
                    <PDFStatus fileId={fileId} />
                </Suspense>
            </div>
        </div>
    )
}