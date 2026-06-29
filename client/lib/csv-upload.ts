import { API_BASE_URL } from "@/lib/api/client";
import { ExtractCSVResponse } from "@/types/extract-csv-pipeline"

export function createIdempotencyKeyForFile(): string {
  return crypto.randomUUID();
}


export async function uploadCsvPipeline(
  file: File,
  idempotencyKey: string,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/files/extract-csv/pipeline`, {
    method: "POST",
    headers: {
      "idempotency-key": idempotencyKey,
    },
    body: formData,
  });


  const data: ExtractCSVResponse   = await response.json()

  if(!data.success || data.status === "failed") {

    throw new Error(data.message ||  data.error)
  }
  return { data, status: response.status };
}



export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
