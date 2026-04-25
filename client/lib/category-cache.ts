import { api } from "./api/client";

let categoryCache: Set<string> | null = null;

export async function getCategoryCache(): Promise<Set<string>> {
  if (categoryCache) return categoryCache;

  // Fetching all category slugs once and cache in memory
  // const res = await fetch('',{
  //     next: {
  //         revalidate: 3600
  //     }
  // })

  const res2 = await api.GET("/api/v1/categories", {
    next: {
      revalidate: 3600,
    },
  });

  // const slugs: string[] = await res.json()

  categoryCache = new Set(res2.data?.map((item) => item.slug));
  console.log(categoryCache);
  return categoryCache;
}
