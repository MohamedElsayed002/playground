import type { Metadata } from "next";
import ProductDetailView from "@/components/extract-csv-pipeline/product-detail";

export const metadata: Metadata = {
  title: "Product Details",
  description: "View a normalized product from a CSV extraction job.",
};

interface PageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id, productId } = await params;

  return <ProductDetailView jobId={id} productId={productId} />;
}
