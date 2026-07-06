import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AuthState } from "@/types/store";
import { authService } from "@/services/auth.service";
import { getErrorMessage, showApiError, showApiSuccess } from "@/lib/toast";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      setUser: (user) => {
        set({ user });
      },

      setHydrated: (value) => {
        set({ isInitialized: value });
      },

      clearState: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        localStorage.removeItem("pokepedia-auth");
        sessionStorage.clear();
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const { data, message } = await authService.login(email, password);
          set({ accessToken: data.accessToken, isAuthenticated: true });
          if (message) {
            showApiSuccess(message);
          }
          
          await get().fetchMe();
        } catch (err: any) {
          showApiError(err, "Incorrect email or password.");
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username, email, password) => {
        try {
          set({ isLoading: true });
          const { message } = await authService.register(username, email, password);
          if (message) {
            showApiSuccess(message);
          }
        } catch (err: any) {
          showApiError(err, "Can not create your account. Please try again.");
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (email, newPassword) => {
        try {
          set({ isLoading: true });
          const { message } = await authService.resetPassword(email, newPassword);
          if (message) {
            showApiSuccess(message);
          }
        } catch (err: any) {
          showApiError(err, "Can not reset your password. Please try again.");
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      sendOTP: async (email, type) => {
        try {
          set({ isLoading: true });
          const { message } = await authService.sendOTP(email, type);
          if (message) {
            showApiSuccess(message);
          }
        } catch (err: any) {
          showApiError(err, "Can not send OTP right now. Please try again later.");
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, otp, type) => {
        try {
          set({ isLoading: true });
          const { message } = await authService.verifyOTP(email, otp, type);
          if (message) {
            showApiSuccess(message);
          }
        } catch (err: any) {
          showApiError(err, "Incorrect or expired OTP.");
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
          const { data } = await authService.refresh();
          setAccessToken(data.accessToken);

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
          const { data: user } = await authService.fetchMe();
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