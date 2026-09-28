import {
  addProductToCartDef,
  checkoutSessionDef,
  getAllUsersDef,
  getCartSummaryDef,
  getProductByNameDef,
  getUserDataDef,
  getUserOrderHistoryDef,
  getUsersCountDef,
  sendEmailDef,
} from "./definitions";
import type { components } from "@/lib/api/schema";

type Product = components["schemas"]["ProductListResponse"];

export const getTotalUsersClient = getUsersCountDef.client(async () => {
  const res = await fetch("/api/total-users");
  const data = await res.json();
  return {
    count: data.count,
  };
});

export const getSingleUserClient = getUserDataDef.client(async ({ userId }) => {
  const res = await fetch("/api/single-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  const data = await res.json();
  return data.user;
});

export const getAllUsersClient = getAllUsersDef.client(async ({ query }: { query?: string }) => {
  const res = await fetch("/api/all-users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data.users;
});

export const sendEmailClient = sendEmailDef.client(async ({ to, subject, text, html, query }) => {
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject,
      text,
      html,
      query,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error || "Failed to send email");
  }

  const data = await res.json();
  return data;
});



// Small E-commerce

export const getProductByNameTool = getProductByNameDef.client(async ({ name }) => {
  const response = await fetch(`/api/small-ecommerce/products?search=${encodeURIComponent(name)}`);
  const data = (await response.json()) as { products?: Product[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to search products right now.");
  }

  return { products: data.products ?? [] };
});

export const getUserOrderHistoryTool = getUserOrderHistoryDef.client(async () => {

  const response = await fetch(`/api/small-ecommerce/orders-history`);

  if (!response.ok) {
    throw new Error("Unable to load your order history right now.");
  }

  const data = await response.json()
  return data

});

export const getCartSummaryTool = getCartSummaryDef.client(async () => {
  const response = await fetch("/api/small-ecommerce/cart-summary");
  const data = (await response.json()) as {
    cart?: components["schemas"]["CartResponse"];
    error?: string;
  };

  if (!response.ok || !data.cart) {
    throw new Error(data.error ?? "Unable to load your cart right now.");
  }

  return {
    cart: {
      id: data.cart.id,
      user_id: data.cart.user_id,
      subtotal: data.cart.subtotal ?? null,
      items: (data.cart.items ?? []).map(({ id, quantity, product }) => ({
        id,
        quantity,
        product: {
          ...product,
          images: product.images ?? [],
          flash_sales: product.flash_sales ?? [],
        },
      })),
    },
  };
});


export const addToCartTool = addProductToCartDef.client(async ({ productId }) => {
  const response = await fetch("/api/small-ecommerce/add-to-cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });

  const data = (await response.json()) as { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to add product to cart");
  }

  return { message: data.message ?? "Product successfully added to cart" };
});

export const checkoutCartTool = checkoutSessionDef.client(async (checkoutDetails) => {
  const response = await fetch("/api/small-ecommerce/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(checkoutDetails),
  });

  const data = (await response.json()) as { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to complete checkout right now.");
  }

  return { message: data.message ?? "Your order was placed successfully." };
});