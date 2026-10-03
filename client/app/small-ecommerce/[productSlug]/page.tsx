import { api } from "@/lib/api/client";
import type { Metadata } from "next";
import type { ProductDetail } from "@/types/products";
import { ProductDetailView } from "@/components/single-product/product-detail-view";
import { getApiErrorMessage } from "@/lib/action-result";
interface PageProps {
  params: Promise<{ productSlug: string }>;
}

async function getProduct(productSlug: string) {
  try {
    const response = await api.GET("/api/v1/products/slug/{slug}", {
      params: { path: { slug: productSlug } },
    });

    if (response.error) {
      return {
        product: null,
        error: getApiErrorMessage(
          response.error,
          "Unable to load this product right now.",
          response.response.status,
        ),
      };
    }

    return { product: (response.data ?? null) as ProductDetail | null, error: undefined };
  } catch {
    return { product: null, error: "Unable to load this product right now. Please try again." };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const { product } = await getProduct(productSlug);

  return {
    title: product?.name || "Product not found",
    description: product?.description || "Description not available",
  };
}

export default async function Page({ params }: PageProps) {
  const { productSlug } = await params;
  const { product, error } = await getProduct(productSlug);
  return <ProductDetailView product={product} error={error} />;
}
