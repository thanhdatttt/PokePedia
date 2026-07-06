"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useAuthToasts } from "@/hooks/authToast";

/**
 * Runs once on app load. Tries to silently restore a session using the
 * httpOnly refresh cookie (see lib/api.ts + stores/auth.store.ts `refresh`).
 * The access token is never persisted, so this is the only way a page
 * reload gets a valid access token back into memory.
 *
 * Render children immediately underneath rather than blocking on a
 * spinner — bootstrap resolves quickly and components that care about
 * auth state should read `isInitialized`/`isAuthenticated` themselves
 * (e.g. to redirect away from /login once a session is confirmed).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const ranOnce = useRef(false);

  useAuthToasts();

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}
