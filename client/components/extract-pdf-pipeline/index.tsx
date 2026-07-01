"use client"

import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"
import { usePDFUpload } from "@/hooks/use-pdf-upload"
import { createIdempotencyKeyForFile } from "@/lib/csv-upload"
import { sileo } from "sileo"

const formSchema = z.object({
    file: z.custom<File>(
        (value) => value instanceof File,
        { message: "Please select a PDF file." }
    ).refine((file) => file.type === "application/pdf", {
        message: "Only PDF files are allowed.",
    }),
})

export function ExtractPdfPipeline() {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    const { mutateAsync } = usePDFUpload()


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            file: undefined as unknown as File,
        },
    })

    const selectedFile = form.watch("file")

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        const idempotencyKey = createIdempotencyKeyForFile()

        try {
            const response = await mutateAsync({ file: data.file, idempotencyKey })

            if ("status" in response && response.status === "processing") {
                sileo.success({
                    title: "PDF processing started",
                    description: "Your PDF is being processed. You will be notified when it's completed.",
                })
                return
            }

            sileo.error({
                title: "PDF processing failed"
            })

        } catch (error) {
            sileo.error({
                title: "PDF upload failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
            })
        }
    }

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = () => setIsDragging(false)

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(false)

        const droppedFile = event.dataTransfer.files?.[0]
        if (droppedFile) {
            form.setValue("file", droppedFile, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            })
        }
    }

    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const chosenFile = event.target.files?.[0]
        if (chosenFile) {
            form.setValue("file", chosenFile, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            })
        }
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            <Card className="overflow-hidden border-orange-200/70 bg-background/90 shadow-xl shadow-orange-100/40 backdrop-blur-sm">
                <CardHeader className="border-b -mt-5 border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white">
                    <CardTitle className="text-2xl font-semibold text-orange-700">Upload PDF</CardTitle>
                    <CardDescription className="max-w-xl text-sm text-muted-foreground">
                        Drop a PDF document here to begin extraction, validation, and ingestion.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 sm:p-8">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <Controller
                            control={form.control}
                            name="file"
                            render={() => (
                                <div
                                    onClick={() => inputRef.current?.click()}
                                    onDragOver={onDragOver}
                                    onDragEnter={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    className={cn(
                                        "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200",
                                        isDragging
                                            ? "border-orange-500 bg-orange-50 shadow-inner"
                                            : "border-orange-200 bg-orange-50/40 hover:border-orange-400 hover:bg-orange-50/70"
                                    )}
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                                        📄
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">
                                        {selectedFile ? "PDF ready to process" : "Drag & drop your PDF here"}
                                    </h3>
                                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                        {selectedFile
                                            ? `${selectedFile.name} • ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                                            : "You can also browse your device to upload a PDF file manually."}
                                    </p>
                                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                        <Button type="button" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                                            Browse PDF
                                        </Button>
                                        <span className="text-sm text-muted-foreground">or drag and drop</span>
                                    </div>

                                    <Input
                                        ref={inputRef}
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        onChange={handleFileSelection}
                                    />
                                </div>
                            )}
                        />

                        {form.formState.errors.file?.message ? (
                            <p className="text-sm font-medium text-red-500">{form.formState.errors.file.message}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Supported format: PDF only</p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                            <div>
                                {/* <p className="text-sm font-medium text-foreground">Ready when you are</p> */}
                                {/* <p className="text-sm text-muted-foreground">The upload UI is prepared for your backend integration.</p> */}
                            </div>
                            <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700">
                                Extract PDF
                            </Button>
                        </div>
                    </form>
                </CardContent>

                <CardFooter className="border-t border-orange-100 bg-gradient-to-r from-white to-orange-50/70 px-6 py-4 text-sm text-muted-foreground">
                    PDF files only • Secure upload flow • Ready for extraction
                </CardFooter>
            </Card>
        </div>
    )
}