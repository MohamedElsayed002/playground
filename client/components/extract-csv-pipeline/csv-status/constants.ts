import type { ReportStep } from "./types";

export const REPORT_STEPS: ReportStep[] = [
  { title: "Upload received", description: "We accepted the CSV and queued it for processing.", progress: 10 },
  { title: "CSV parsed", description: "The file was read and the rows were counted.", progress: 20 },
  { title: "Validation complete", description: "We checked required columns and data quality.", progress: 30 },
  { title: "File normalized", description: "The CSV was cleaned and standardized.", progress: 40 },
  { title: "Quality saved", description: "Validation results were written back to the job.", progress: 50 },
  { title: "Normalized file saved", description: "The cleaned file is ready for review.", progress: 60 },
  { title: "Database ingest started", description: "We began loading rows into your report tables.", progress: 70 },
  { title: "Rows ingested", description: "The data import finished successfully.", progress: 80 },
  { title: "Ingestion finalized", description: "We stored the final ingestion totals.", progress: 90 },
  { title: "Report ready", description: "Your report is complete and ready to explore.", progress: 100 },
];
