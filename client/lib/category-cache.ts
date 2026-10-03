import { api } from "./api/client";
import { requestApiData } from "./action-result";

let categoryCache: Set<string> | null = null;

export async function getCategoryCache(): Promise<Set<string>> {
  if (categoryCache) return categoryCache;

  // Fetching all category slugs once and cache in memory
  // const res = await fetch('',{
  //     next: {
  //         revalidate: 3600
  //     }
  // })

  const categories = await requestApiData(
    () =>
      api.GET("/api/v1/categories", {
        next: {
          revalidate: 3600,
        },
      }),
    "Unable to load product categories.",
  );

  // const slugs: string[] = await res.json()

  categoryCache = new Set(categories.map((item) => item.slug));
  console.log(categoryCache);
  return categoryCache;
}
