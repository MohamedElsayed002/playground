import type { Metadata } from "next";
import NormalizedProductsView from "@/components/extract-csv-pipeline/normalized-products";

export const metadata: Metadata = {
  title: "Normalized Products",
  description: "Browse normalized products from a CSV extraction job.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <NormalizedProductsView jobId={id} />;
}
