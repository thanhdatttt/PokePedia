import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AuthState } from "@/types/store";
import { authService } from "@/services/auth.service";

function getErrorMessage(err: any, fallback: string): string {
  return err?.response?.data?.message ?? fallback;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      setUser: (user) => {
        set({ user });
      },

      setHydrated: (value) => {
        set({ isInitialized: value });
      },

      clearError: () => {
        set({ error: null });
      },

      clearState: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        localStorage.removeItem("pokepedia-auth");
        sessionStorage.clear();
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const res = await authService.login(email, password);
          set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true });
        } catch (err: any) {
          console.log(err);
          set({ error: getErrorMessage(err, "Invalid email or password.") });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username, email, password) => {
        try {
          set({ isLoading: true });
          const res = await authService.register(username, email, password);
        } catch (err: any) {
          console.log(err);
          set({ error: getErrorMessage(err, "Can not create your account. Please try again.") });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (email, newPassword) => {
        try {
          set({ isLoading: true, error: null });
          await authService.resetPassword(email, newPassword);
        } catch (err: any) {
          set({
            error: getErrorMessage(err, "Can not reset your password. Please try again."),
          });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      sendOTP: async (email, type) => {
        try {
          set({ isLoading: true });
          await authService.sendOTP(email, type);
        } catch (err: any) {
          console.log(err);
          set({ error: getErrorMessage(err, "Can not send OTP right now.  Please try again.") });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, otp, type) => {
        try {
          set({ isLoading: true });
          await authService.verifyOTP(email, otp, type);
        } catch (err: any) {
          console.log(err);
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await authService.logout();
        } catch (err: any) {
          console.log(err);
          throw err;
        } finally {
          set({ isLoading: false });
          get().clearState();
        }
      },

      refresh: async () => {
        try {
          set({ isLoading: true });
          
          const { user, setAccessToken, fetchMe } = get();
          const res = await authService.refresh();
          setAccessToken(res.accessToken);

          if (!user) {
            await fetchMe();
          }
        } catch (err: any) {
          console.log(err);
          get().clearState();
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      bootstrap: async () => {
        try {
          await get().refresh();
        } catch {
          // move on
        } finally {
          set({ isInitialized: true });
        }
      },

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const user = await authService.fetchMe();
          set({ user });
        } catch (err: any) {
          console.log(err);
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },
    }), 
    {
      name: "pokepedia-auth", // local storage key
      storage: createJSONStorage(() => localStorage),
      // Only persist the session data
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);