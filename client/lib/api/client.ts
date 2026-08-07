import createClient from "openapi-fetch";
import type { paths } from "./schema";

export const API_BASE_URL = "https://playground-ecommerce-fastapi.vercel.app"

export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
});
