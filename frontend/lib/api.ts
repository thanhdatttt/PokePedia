import axios, { AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";
import { config } from "./config";
import { ApiSuccessEnvelope } from "@/types/response";

// Augment AxiosResponse so callers can read the backend's `message` field
// alongside the already-unwrapped `data` payload.
declare module "axios" {
  interface AxiosResponse<T = any> {
    message?: string;
  }
}

// Unwraps { success, statusCode, message, data } into response.data = data,
// and hangs `message` off the response object for callers that want it
// (e.g. to show a toast). Runs on every successful response.
function unwrapEnvelope(res: AxiosResponse) {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body && body.success) {
    const envelope = body as ApiSuccessEnvelope;
    res.data = envelope.data;
    res.message = envelope.message;
  }
  return res;
}

export const authClient = axios.create({
  baseURL: `${config.NEXT_PUBLIC_API_URL}/auth`,
  withCredentials: true,
});

authClient.interceptors.response.use(unwrapEnvelope);

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

api.interceptors.response.use(unwrapEnvelope, async (error: AxiosError) => {
  const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

  const isUnauthorized = error.response?.status === 401;

  // check token is expired or invalid and refresh
  if (isUnauthorized && originalRequest && !originalRequest._retry) {
    originalRequest._retry = true; // only ever retry a given request once

    try {
      const res = await api.post("/auth/refresh");
      const newAccessToken = res.data.accessToken; // already unwrapped by interceptor above
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