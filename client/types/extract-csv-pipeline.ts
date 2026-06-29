import type { components } from "@/lib/api/schema";

export type ReportJob = components["schemas"]["Job"];
export type NormalizedProduct = components["schemas"]["ProductReportResponse"];
export type ReportJobListResponse = components["schemas"]["ReportJobListResponse"];
export type NormalizedProductListResponse = components["schemas"]["ProductReportListResponse"];

export type ProductSortField = "price" | "product_name" | "category";
export type SortOrder = "asc" | "desc";


type ExtractCSVSuccessfully = {
    success: true
    job_id?: string
    status: string
    file_name?: string
    message?: string
    idempotency_key?: string
    current_step?: string
}

type ExtractCSVError = {
    success: false
    status_code: number
    error_code: string
    message: string
    path: string
    request_id: string
    errors: any
}

export type ExtractCSVResponse = ExtractCSVSuccessfully | ExtractCSVError
