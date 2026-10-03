"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { API_URL, authApi } from "@/lib/api";
import type { AuthTokens, AuthTokensFastAPI } from "@/types";
import { api } from "@/lib/api/client";
import {
  actionFailure,
  actionSuccess,
  getApiErrorMessage,
  type ActionResult,
} from "@/lib/action-result";

const ACCESS_COOKIE = "chat_access";
const REFRESH_COOKIE = "chat_refresh";

const ACCESS_COOKIE_FASTAPI = "fastapi_access";
const REFRESH_COOKIE_FASTAPI = "fastapi_refresh";

async function saveTokensToCookies(tokens: AuthTokens) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 15,
  });

  cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function saveTokensFastAPICookies(tokens: AuthTokensFastAPI) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  cookieStore.set(ACCESS_COOKIE_FASTAPI, tokens.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 15,
  });

  cookieStore.set(REFRESH_COOKIE_FASTAPI, tokens.refresh_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  try {
    const tokens = await authApi.register({ email, password, username });
    await saveTokensToCookies(tokens);
    return tokens;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Error";
    throw new Error(errMessage);
  }
}

export async function registerFastAPIAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const first_name = formData.get("first_name") as string;
  const username = formData.get("username") as string;
  const last_name = formData.get("last_name") as string;

  try {
    const response = await api.POST("/api/v1/auth/register", {
      body: {
        username,
        password,
        first_name,
        last_name,
        email,
      },
    });

    if (response.error) {
      return actionFailure(
        getApiErrorMessage(
          response.error,
          "Unable to create your account. Please try again.",
          response.response.status,
        ),
      );
    }

    return actionSuccess(response.data);
  } catch {
    return actionFailure("Unable to create your account. Please try again.");
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const tokens = await authApi.login({ email, password });
    await saveTokensToCookies(tokens);
    return tokens;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Error";
    throw new Error(errMessage);
  }
}

export async function loginFastAPIAction(
  formData: FormData,
): Promise<ActionResult<AuthTokensFastAPI>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return actionFailure("Email and password are required");
  }

  try {
    const response = await api.POST("/api/v1/auth/login", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        username: email,
        password,
        scope: "",
      },
      bodySerializer(body) {
        return new URLSearchParams(body as Record<string, string>);
      },
    });

    if (response.error) {
      return actionFailure(
        getApiErrorMessage(response.error, "Login failed. Please try again.", response.response.status),
      );
    }

    await saveTokensFastAPICookies(response.data);
    return actionSuccess(response.data);
  } catch {
    return actionFailure("Unable to log in right now. Please try again.");
  }
}

export async function saveOAuthTokensAction(tokens: AuthTokens) {
  await saveTokensToCookies(tokens);
}

// Clear Auth Cookies
export async function clearAuthCookiesAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function clearAuthCookiesActionFastAPI() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_FASTAPI);
  cookieStore.delete(REFRESH_COOKIE_FASTAPI);
}

export async function getFastAPITokensFromCookies() {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get(ACCESS_COOKIE_FASTAPI)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_COOKIE_FASTAPI)?.value ?? null,
  };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    await authApi.logout(refreshToken).catch(() => {});
  }

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect("/auth/login");
}

export async function logoutFastAPIAction() {
  const { accessToken, refreshToken } = await getFastAPITokensFromCookies();

  if (accessToken) {
    try {
      const response = await api.POST("/api/v1/auth/logout", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.error) {
        console.error(
          "FastAPI logout failed:",
          // @ts-expect-error accept unknown type for response.error
          getApiErrorMessage(response.error, "Logout failed", response.response.status),
        );
      }
    } catch (error) {
      console.error("FastAPI logout request failed:", error);
    }
  }

  if (refreshToken) {
    // Keep this ready for your custom refresh-token handling if needed.
    // The backend logout route above uses the access token to identify the current user.
  }

  await clearAuthCookiesActionFastAPI();
  redirect("/auth/login");
}

type UserResponse = {
  userId: string;
  profile: string;
  email: string;
};

export async function getSession(): Promise<UserResponse | null> {
  const cookieSession = await cookies();
  const accessToken = cookieSession.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const me = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!me.ok) return null;

    const data: UserResponse = await me.json();
    return data;
  } catch {
    return null;
  }
}
