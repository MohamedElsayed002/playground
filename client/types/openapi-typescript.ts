import { api } from "@/lib/api/client";

import type { paths } from "@/lib/api/schema";

export type ProductsResponse =
  paths["/api/v1/products"]["get"]["responses"]["200"]["content"]["application/json"];
