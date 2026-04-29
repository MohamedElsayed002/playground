import { Suspense } from "react";
import { ProductsExplorer } from "./page.client";

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl p-6">Loading...</div>}>
      <ProductsExplorer />
    </Suspense>
  );
}

