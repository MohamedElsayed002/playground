import {
    PdfStatusResponse,
    PdfStatusCompleted,
    PdfStatusFailed,
    PdfStatusProcessing
} from "@/types/extract-pdf-pipeline";
import { API_BASE_URL } from "./api/client";



function isPendingResponse(data: PdfStatusResponse): data is PdfStatusProcessing {
    return typeof data === "object" && data !== null && "status" in data && data.status === "processing";
}

function isCompletedResponse(data: PdfStatusResponse): data is PdfStatusCompleted {
    return typeof data === "object" && data !== null && "status" in data && data.status === "completed";
}

export async function uploadPDFPipeline(
    file: File,
    idempotencyKey: string
): Promise<PdfStatusResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/v1/files/pdf/extract-authenticated`, {
        method: "POST",
        headers: {
            "idempotency-key": idempotencyKey,
        },
        body: formData,
    });

    const data = (await response.json()) as PdfStatusResponse;

    if (isPendingResponse(data)) {
        return data;
    }

    if (isCompletedResponse(data)) {
        return data;
    }

    return data as PdfStatusFailed;
}