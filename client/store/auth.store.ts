import { create } from "zustand";
import type { AuthProfile } from "@/types";
import { tokenStorage } from "@/lib/api";

interface AuthState {
  profile: AuthProfile | null;
  isLoggedIn: boolean;
  setSession: (profile: AuthProfile, tokens: { accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoggedIn: false,
  setSession: (profile, tokens) => {
    tokenStorage.setTokens(tokens);
    set({ profile, isLoggedIn: true });
  },
  clearSession: () => {
    tokenStorage.clearTokens();
    set({ profile: null, isLoggedIn: false });
  },
}));
