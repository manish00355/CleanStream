import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),

  setAccessToken: (token) => set({ accessToken: token }),

  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      name: "auth-storage",
    }),
  )
);

export default useAuthStore;
