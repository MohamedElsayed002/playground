"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, tokenStorage } from "@/lib/api";
import { clearAuthCookiesAction, clearAuthCookiesActionFastAPI, loginAction, loginFastAPIAction, registerAction, registerFastAPIAction } from "@/actions/auth.actions";
import { useAuthStore } from "@/store/auth.store";
import { sileo } from "sileo";
import { disconnectSocket } from "@/lib/socket";
import { api } from "@/lib/api/client";
import { useAuthStoreFastAPI } from "@/store/auth-fastapi.store";

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; username: string }) => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("username", data.username);
      return registerAction(formData);
    },
    onSuccess: (data) => {
      setSession(data.profile, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/");
    },
  });
}

export function useRegisterFastAPI() {
  // const setSession = useAuthStoreFastAPI((s) => s.setSession)
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { email: string; password: string; first_name: string; last_name: string; username: string }) => {
      const formData = new FormData()
      formData.set("email", data.email)
      formData.set("password", data.password)
      formData.set("first_name", data.first_name)
      formData.set("last_name", data.last_name)
      formData.set("username", data.username)
      return registerFastAPIAction(formData)
    },
    onSuccess: (data) => {
      sileo.success({
        title: "User registered successfully",
        description: "Please login to continue",
      })
      router.push("/auth/login-fastapi")
    },
    onError: (error) => {
      sileo.error({
        title: "Error",
        description: error.message,
      })
    }
  })
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      return loginAction(formData);
    },
    onSuccess: (data) => {
      setSession(data.profile, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/");
    },
  });
}

async function fetchFastAPIMe(accessToken: string) {
  const response = await api.GET("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.error) {
    return null;
  }


  return {
    id: String(response.data.id),
    userId: String(response.data.id),
    username: response.data.username,
    email: response.data.email,
    avatarUrl: response.data.avatar_url ?? null,
  };
}

export function useLoginFastAPI() {
  const setSession = useAuthStoreFastAPI((s) => s.setSession)
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const formData = new FormData()
      formData.set("email", data.email)
      formData.set("password", data.password)
      return loginFastAPIAction(formData)
    },
    onSuccess: async (data) => {
      const tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
      const profile = await fetchFastAPIMe(tokens.access_token);
      setSession(profile, tokens);
      router.push("/");
    },
    onError: (error) => {
      console.log(error.message, error.cause)
    }
  })
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => null);
      }
      await clearAuthCookiesAction();
    },
    onSettled: () => {
      clearSession();
      disconnectSocket();
      queryClient.clear();
      sileo.success({
        title: "Successfully",
        description: "User logged out successfully",
      });
      router.push("/auth/login");
      router.refresh();
    },
  });
}

export function useLogoutFastAPI() {
  const clearSession = useAuthStoreFastAPI((s) => s.clearSession)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const accessToken = localStorage.getItem("fastapi_access");
      const refreshToken = localStorage.getItem("fastapi_refresh");

      if (accessToken) {
        await api.POST("/api/v1/auth/logout", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).catch(() => null);

        await clearAuthCookiesActionFastAPI()
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("fastapi_access");
        localStorage.removeItem("fastapi_refresh");
      }

      if (refreshToken) return
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      sileo.success({
        title: "Successfully",
        description: "Logged out from FastAPI",
      });

      router.push("/auth/login-fastapi");
      router.refresh();
    },
  })
}