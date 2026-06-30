import type { NormalizedProduct } from "@/types/extract-csv-pipeline";

export type NormalizedProductFormValues = {
  product_id: string;
  product_name: string;
  category: string;
  price: string;
  quantity: string;
  last_restock_date: string;
};

export type NormalizedProductDetail = NormalizedProduct;
