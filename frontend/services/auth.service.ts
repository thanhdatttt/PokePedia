import { api, authClient } from "@/lib/api";

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const res = await authClient.post("/login", {email, password});
      return res.data;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const res = await authClient.post("/register", {username, email, password});
      return res.data;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  },

  resetPassword: async (email: string, newPassword: string) => {
    try {
      const res = await authClient.post("/reset-password", {email, newPassword});
      return res.data;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  },

  sendOTP: async (email: string) => {
    try {
      const res = await authClient.post("/send-otp", {email});
      return res.data;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    try {
      const res = await authClient.post("/verify-otp", {email, otp});
      return res.data;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  },

  logout: async () => {
    try {
      await authClient.post("/logout");
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  },

  refresh: async () => {
    try {
      const res = await authClient.post("/refresh");
      return res.data;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  },

  fetchMe: async () => {
    try {
      const res = await api.post("/users/me");
      return res.data;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  }
}