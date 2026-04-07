"use client";

import { saveOAuthTokensAction } from "@/actions/auth.actions";
import { useAuthStore } from "@/store/auth.store";
import type { AuthTokens } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sileo } from "sileo";

function decodeBase64UrlToJson<T>(segment: string): T {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const json = atob(padded);
  return JSON.parse(json) as T;
}

export default function GoogleOAuthCallbackPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    async function completeGoogleSignIn() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const match = /^#data=(.+)$/.exec(hash);
      if (!match) {
        setMessage("Something went wrong. Redirecting to login…");
        sileo.error({
          title: "Google sign-in failed",
          description: "Missing session data. Try again.",
        });
        router.replace("/auth/login");
        return;
      }

      try {
        const tokens = decodeBase64UrlToJson<AuthTokens>(match[1]);
        await saveOAuthTokensAction(tokens);
        if (cancelled) return;

        setSession(tokens.profile, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        window.history.replaceState(null, "", window.location.pathname);
        sileo.success({ title: "Logged in successfully" });
        router.replace("/");
      } catch {
        if (cancelled) return;
        setMessage("Could not complete sign-in. Redirecting…");
        sileo.error({
          title: "Google sign-in failed",
          description: "Invalid session data.",
        });
        router.replace("/auth/login");
      }
    }

    void completeGoogleSignIn();
    return () => {
      cancelled = true;
    };
  }, [router, setSession]);

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </main>
  );
}
