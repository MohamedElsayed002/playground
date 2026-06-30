import type { NormalizedProductDetail, NormalizedProductFormValues } from "./types";

export function formatCurrency(value: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

export function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function toCreateFormValues(): NormalizedProductFormValues {
  return {
    product_id: "",
    product_name: "",
    category: "",
    price: "",
    quantity: "",
    last_restock_date: "",
  };
}

export function toEditFormValues(product: NormalizedProductDetail): NormalizedProductFormValues {
  return {
    product_id: product.product_id ?? "",
    product_name: product.product_name ?? "",
    category: product.category ?? "",
    price: product.price ?? "",
    quantity: String(product.quantity ?? ""),
    last_restock_date: toDateInputValue(product.last_restock_date),
  };
}

function parsePayloadValues(values: NormalizedProductFormValues) {
  const productId = values.product_id.trim();
  const productName = values.product_name.trim();
  const category = values.category.trim();
  const price = Number(values.price);
  const quantity = Number(values.quantity);
  const lastRestockDate = values.last_restock_date.trim();

  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!productName) {
    throw new Error("Product name is required");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Price must be a valid number greater than 0");
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Quantity must be a whole number");
  }

  return {
    product_id: productId,
    product_name: productName,
    category: category.length > 0 ? category : null,
    price,
    quantity,
    last_restock_date: lastRestockDate.length > 0 ? lastRestockDate : null,
  };
}

export function buildCreatePayload(values: NormalizedProductFormValues) {
  return parsePayloadValues(values);
}

export function buildUpdatePayload(
  original: NormalizedProductDetail,
  values: NormalizedProductFormValues,
) {
  const parsed = parsePayloadValues(values);
  const payload: Record<string, string | number | null> = {};

  if (parsed.product_name !== original.product_name) {
    payload.product_name = parsed.product_name;
  }

  const originalCategory = original.category ?? null;
  if (parsed.category !== originalCategory) {
    payload.category = parsed.category;
  }

  if (String(parsed.price) !== String(original.price)) {
    payload.price = parsed.price;
  }

  if (parsed.quantity !== original.quantity) {
    payload.quantity = parsed.quantity;
  }

  const originalRestockDate = toDateInputValue(original.last_restock_date);
  if (parsed.last_restock_date !== originalRestockDate) {
    payload.last_restock_date = parsed.last_restock_date;
  }

  return payload;
}
