import { User } from "./user";
import { TypeChart, TypeEffectiveness } from "./pokemonType";


// auth store
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  setHydrated: (value: boolean) => void;
  clearState: () => void;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  sendOTP: (email: string, type: string) => Promise<void>;
  verifyOTP: (email: string, otp: string, type: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  bootstrap: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

// type store
export type ViewMode = "matrix" | "lookup";

export interface TypeChartState {
  // data
  chart: TypeChart | null;
  isLoading: boolean;
  // ui state
  viewMode: ViewMode;
  selectedTypes: string[]; // 1-2 entries, used in "lookup" mode
  hoveredAttacker: string | null;
  hoveredDefender: string | null;

  // derived (recomputed on demand, not stored reactively to keep this simple)
  getEffectiveness: () => TypeEffectiveness | null;

  // actions
  fetchChart: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  toggleSelectedType: (name: string) => void;
  clearSelectedTypes: () => void;
  setHovered: (attacker: string | null, defender: string | null) => void;
}