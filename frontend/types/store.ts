import { User } from "./user";

// auth store
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  setHydrated: (value: boolean) => void;
  clearError: () => void;
  clearState: () => void;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  bootstrap: () => Promise<void>;
  fetchMe: () => Promise<void>;
}