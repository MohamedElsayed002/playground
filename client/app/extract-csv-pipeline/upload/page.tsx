import Link from "next/link";
import { UploadFile } from "@/components/upload-csv";
import { PageShell } from "@/components/extract-csv-pipeline/shared/page-shell";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extract your CSV file",
  description: "Upload a CSV file to start the extraction pipeline.",
};

export default function Page() {
  return (
    <PageShell
      title="Upload CSV"
      description="Upload a CSV file to start extraction, validation, and ingestion."
      breadcrumbs={[
        { label: "Extract CSV Pipeline", href: "/extract-csv-pipeline" },
        { label: "Upload" },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href="/extract-csv-pipeline">Back to jobs</Link>
        </Button>
      }
    >
      <UploadFile />
    </PageShell>
  );
}
