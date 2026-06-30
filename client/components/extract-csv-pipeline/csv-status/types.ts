export type JobStatusResponse = {
  id: string;
  original_filename: string;
  status: string;
  current_step: string | null;
  progress: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  invalid_price: number;
  invalid_quantity: number;
  invalid_dates: number;
  ingested_rows: number;
  ingestion_status: string;
  failure_reason: string | null;
  quality_score?: number | null;
};

export type ReportStep = {
  title: string;
  description: string;
  progress: number;
};

export type ReportMetric = {
  label: string;
  value: string;
  hint: string;
};
