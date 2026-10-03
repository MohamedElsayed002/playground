import createClient from "openapi-fetch";
import type { paths } from "./schema";

// export const API_BASE_URL =
//   typeof window === "undefined"
//     ? (process.env.INTERNAL_FASTAPI_API_URL ?? "http://localhost:8001")
//     : (process.env.NEXT_PUBLIC_FASTAPI_API_URL ?? "https://playground-ecommerce-fastapi.vercel.app");

export const API_BASE_URL = "https://playground-ecommerce-fastapi.vercel.app";
export const api = createClient<paths>({
  baseUrl: "https://playground-ecommerce-fastapi.vercel.app",
});
