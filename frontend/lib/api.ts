import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";
import { config } from "./config";

export const authClient = axios.create({
  baseURL: `${config.NEXT_PUBLIC_API_URL}/auth`,
  withCredentials: true,
});

export const api = axios.create({
  baseURL: config.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use((res) => res, async (error: AxiosError) => {
  const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

  const isUnauthorized = error.response?.status === 401;

  // check token is expired or invalid and refresh
  if (isUnauthorized && originalRequest && !originalRequest._retry) {
    originalRequest._retry = true; // only ever retry a given request once

    try {
      const res = await api.post("/auth/refresh");
      const newAccessToken = res.data.accessToken;
      useAuthStore.getState().setAccessToken(newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // continue that request
      return api(originalRequest);
    } catch (err) {
      console.log(err);
      useAuthStore.getState().clearState();
      return Promise.reject(err);
    }
  }

  return Promise.reject(error);
});