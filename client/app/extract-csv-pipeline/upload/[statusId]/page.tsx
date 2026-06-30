import { CSVStatus } from "@/components/extract-csv-pipeline/csv-status";
import { PageShell } from "@/components/extract-csv-pipeline/shared/page-shell";

interface PageProps {
  params: Promise<{ statusId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { statusId } = await params;

  return (
    <PageShell
      title="Report status"
      description="Track this CSV report as it moves from upload to completed analytics."
      breadcrumbs={[
        { label: "Extract CSV Pipeline", href: "/extract-csv-pipeline" },
        { label: "Upload status" },
      ]}
    >
      <CSVStatus statusId={statusId} />
    </PageShell>
  );
}
