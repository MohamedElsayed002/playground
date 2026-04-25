import { api } from "@/lib/api/client";
import { getCategoryCache } from "@/lib/category-cache";
import Link from "next/link";
import { notFound } from "next/navigation";

// User types /nike-air-zoom directly (or Google crawls it)
//   → app/[slug]/page.tsx runs on server
//   → No ?t= hint → checks category cache (0 API calls)
//   → Not a category → fetchProduct() (1 API call)
//   → Returns product page

// User clicks a <ProductCard> link (/nike-air-zoom?t=p)
//   → Next.js client-side navigation
//   → ?t=p detected → fetchProduct() directly (1 API call)
//   → Server-side resolver completely bypassed

// User clicks a <CategoryLink> (/shoes?t=c)
//   → ?t=c detected → fetchCategory() directly (1 API call)
//   → Zero ambiguity, zero wasted calls

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ slug }, { t: typeHint }] = await Promise.all([params, searchParams]);

  if (typeHint === "p") {
    const product = await api.GET("/api/v1/products/slug/{slug}", {
      params: {
        path: {
          slug,
        },
      },
    });

    if (product.error) {
      console.log(product.error);
      return;
    }
    // Product Component
    return (
      <div>
        <h1>Product Page</h1>
        {JSON.stringify(product.data, null, 2)}
        <Link href={`/test/${slug}?t=p`}>
          <div className="card">{product.data.name}</div>
        </Link>
      </div>
    );
  }

  if (typeHint === "c") {
    const category = await api.GET("/api/v1/categories/{category_slug}", {
      params: {
        path: {
          category_slug: slug,
        },
      },
    });

    if (category.error) {
      console.log(category.error);
      return;
    }

    return (
      <div>
        <h1>Category Page</h1>
        {JSON.stringify(category.data, null, 2)}
        <Link href={`/test/${slug}?t=c`}>{category.data.name}</Link>
      </div>
    );
  }

  const cache = await getCategoryCache();
  if (cache.has(slug)) {
    const category = await api.GET("/api/v1/categories/{category_slug}", {
      params: { path: { category_slug: slug } },
    });
    if (!category.data) return notFound();
    // Category Page
    return (
      <div>
        <h1>Category Page</h1>
        {JSON.stringify(category.data, null, 2)}
        <Link href={`/test/${slug}?t=c`}>{category.data.name}</Link>
      </div>
    );
  }

  const product = await api.GET("/api/v1/products/slug/{slug}", { params: { path: { slug } } });
  if (product.data) {
    // Product Comp
    return (
      <div>
        {JSON.stringify(product, null, 2)}
        <Link href={`/test/${slug}?t=p`}>
          <div className="card">{product.data.name}</div>
        </Link>
      </div>
    );
  }

  return notFound();
}
