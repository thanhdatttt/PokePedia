import { api, publicApi } from "@/lib/api";

export const authService = {
  login: async (email: string, password: string) => {
    const res = await publicApi.post("/auth/login", { email, password });
    return { data: res.data, message: res.message };
  },

  register: async (username: string, email: string, password: string) => {
    const res = await publicApi.post("/auth/register", { username, email, password });
    return { data: res.data, message: res.message };
  },

  resetPassword: async (email: string, newPassword: string) => {
    const res = await publicApi.post("/auth/reset-password", { email, newPassword });
    return { data: res.data, message: res.message };
  },

  sendOTP: async (email: string, type: string) => {
    const res = await publicApi.post("/auth/send-otp", { email, type });
    return { data: res.data, message: res.message };
  },

  verifyOTP: async (email: string, otp: string, type: string) => {
    const res = await publicApi.post("/auth/verify-otp", { email, otp, type });
    return { data: res.data, message: res.message };
  },

  logout: async () => {
    const res = await publicApi.post("/auth/logout");
    return { data: res.data, message: res.message };
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh");
    return { data: res.data, message: res.message };
  },

  fetchMe: async () => {
    const res = await api.post("/users/me");
    return { data: res.data, message: res.message };
  },
};