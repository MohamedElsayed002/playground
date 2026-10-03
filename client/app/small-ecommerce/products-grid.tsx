"use client";

import type { components } from "@/lib/api/schema";
import { SingleProduct } from "./single-product";
import { useAuthStoreFastAPI } from "@/store/auth-fastapi.store";

type Product = components["schemas"]["ProductListResponse"];

type Products = {
  products: Product[];
};

export const ProductsGrid = ({ products }: Products) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {products.map((item) => (
        <SingleProduct key={item.id} item={item} />
      ))}
    </div>
  );
};
