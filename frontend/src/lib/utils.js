import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}

/**
 * Single source of truth for the backend base URL.
 * Used by both api.js and socket.js so they never drift apart.
 *
 * Priority:
 *   1. VITE_API_URL env var (set in .env / deployment)
 *   2. Same origin as the frontend (works when backend serves frontend too)
 *   3. localhost:5000 as a last-resort dev fallback
 */
export function getBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  // In dev mode, the Vite dev server proxies to the backend,
  // so window.location.origin is correct.
  // In production, VITE_API_URL must be explicitly set.
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  return window.location.origin; // prod: same origin (backend serves frontend)
}