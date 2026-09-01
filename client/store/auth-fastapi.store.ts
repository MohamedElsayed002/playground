import { create } from "zustand";
import type { AuthProfile } from "@/types";

interface AuthFastAPIState {
  profile: AuthProfile | null;
  isLoggedIn: boolean;
  setSession: (profile: AuthProfile | null, tokens: { access_token: string; refresh_token: string }) => void;
  clearSession: () => void;
}

export const useAuthStoreFastAPI = create<AuthFastAPIState>((set) => ({
  profile: null,
  isLoggedIn: false,
  setSession: (profile, tokens) => {
    // tokenStorage.setTokens(tokens);
    localStorage.setItem("fastapi_access", tokens.access_token);
    localStorage.setItem("fastapi_refresh", tokens.refresh_token);
    set({ profile, isLoggedIn: Boolean(profile) });
  },
  clearSession: () => {
    localStorage.removeItem("fastapi_access");
    localStorage.removeItem("fastapi_refresh");
    set({ profile: null, isLoggedIn: false });
  },
}));
