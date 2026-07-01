export type PdfStatusProcessing = {
    file_id: number
    status: "processing"
    message: string
}

export type PdfStatusCompleted = {
    file_id: number
    status: "completed"
    result: {
        file_id: number
        filename: string
        total_pages: number
        pages: Array<{
            page_number: number
            tables: unknown[]
            text: string
        }>
        full_text: string
        structured_data: unknown
    }
}

export type PdfStatusFailed = {
    file_id: number
    status: "failed"
    error: string
}

export type PdfStatusResponse = PdfStatusProcessing | PdfStatusCompleted | PdfStatusFailed
