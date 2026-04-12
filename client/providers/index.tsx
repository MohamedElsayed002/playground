"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useAuthStore } from "@/store/auth.store";
import { tokenStorage, authApi } from "@/lib/api";
import { Toaster } from "sileo";

// import { TanStackDevtools } from "@tanstack/react-devtools"
import { WebVitals } from "@/components/shared/web-vitals";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch on window focus for chat — real-time covers it
        refetchOnWindowFocus: false,
        // Retry failed requests once before showing an error
        retry: 1,
        // Data is considered fresh for 30 seconds
        staleTime: 30_000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window !== "undefined") {
    return makeQueryClient();
  }

  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) return;

    authApi
      .me()
      .then(async () => {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) return;
        const tokens = await authApi.refresh(refreshToken);
        setSession(tokens.profile, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      })
      .catch(() => {
        tokenStorage.clearTokens();
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WebVitals />
      {children}
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
