/**
 * Centralized API client.
 * Every HTTP call in the app goes through this file.
 */

import { getBaseUrl } from "./utils";

const API_BASE = getBaseUrl();

/* ─── helpers ──────────────────────────────────────────────────────────── */

const getToken = () => localStorage.getItem("auth-token") ?? "";

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  "auth-token": getToken(),
  ...extra,
});

/**
 * Fix #7: handleResponse now checks Content-Type before calling .json().
 * If the server returns an HTML error page (e.g. 502 Bad Gateway),
 * the old code would throw an unhandled parse error.
 * Now it falls back to the status text so the caller always gets a clean Error.
 */
const handleResponse = async (res) => {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const data = await res.json();
      throw new Error(data?.error || data?.message || "Request failed");
    }
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  if (isJson) return res.json();
  return res.text();
};

/**
 * Wrapper around fetch that adds:
 *   - Auth header
 *   - 30-second AbortController timeout (Fix #9)
 *   - handleResponse normalization
 */
const apiFetch = (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  return fetch(url, { ...options, signal: controller.signal })
    .then((res) => {
      clearTimeout(timeoutId);
      return handleResponse(res);
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Request timed out. Please check your connection.");
      }
      throw err;
    });
};

/* ─── auth ─────────────────────────────────────────────────────────────── */

export const authApi = {
  login: (payload) =>
    apiFetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }),

  register: (payload) =>
    apiFetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    apiFetch(`${API_BASE}/api/auth/me`, {
      headers: headers(),
    }),

  sendOtp: (email) =>
    apiFetch(`${API_BASE}/api/auth/getotp`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email }),
    }),

  sendVerificationOtp: () =>
    apiFetch(`${API_BASE}/api/auth/send-verification-otp`, {
      method: "POST",
      headers: headers(),
    }),

  verifyEmail: (otp) =>
    apiFetch(`${API_BASE}/api/auth/verify-email`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ otp }),
    }),
};

/* ─── conversations ────────────────────────────────────────────────────── */

export const conversationApi = {
  list: () =>
    apiFetch(`${API_BASE}/api/conversations/`, {
      headers: headers(),
    }),

  get: (id) =>
    apiFetch(`${API_BASE}/api/conversations/${id}`, {
      headers: headers(),
    }),

  create: (memberIds) =>
    apiFetch(`${API_BASE}/api/conversations/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ members: memberIds }),
    }),

  togglePin: (id) =>
    apiFetch(`${API_BASE}/api/conversations/${id}/pin`, {
      method: "POST",
      headers: headers(),
    }),
};

/* ─── messages ─────────────────────────────────────────────────────────── */

export const messageApi = {
  list: (conversationId) =>
    apiFetch(`${API_BASE}/api/messages/${conversationId}`, {
      headers: headers(),
    }),

  delete: (messageId, scope) =>
    apiFetch(`${API_BASE}/api/messages/${messageId}`, {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ scope }),
    }),

  bulkDelete: (messageIds) =>
    apiFetch(`${API_BASE}/api/messages/bulk/hide`, {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ messageIds }),
    }),

  clearChat: (conversationId) =>
    apiFetch(`${API_BASE}/api/messages/clear/${conversationId}`, {
      method: "POST",
      headers: headers(),
    }),

  toggleStar: (messageId) =>
    apiFetch(`${API_BASE}/api/messages/${messageId}/star`, {
      method: "POST",
      headers: headers(),
    }),

  getStarred: () =>
    apiFetch(`${API_BASE}/api/messages/starred`, {
      headers: headers(),
    }),
};

/* ─── users ────────────────────────────────────────────────────────────── */

export const userApi = {
  getOnlineStatus: (userId) =>
    apiFetch(`${API_BASE}/api/user/online-status/${userId}`, {
      headers: headers(),
    }),

  getNonFriends: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    return apiFetch(`${API_BASE}/api/user/non-friends?${qs.toString()}`, {
      headers: headers(),
    });
  },

  updateProfile: (payload) =>
    apiFetch(`${API_BASE}/api/user/update`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(payload),
    }),

  getPresignedUrl: (filename, filetype) =>
    apiFetch(
      `${API_BASE}/api/user/presigned-url?filename=${encodeURIComponent(
        filename
      )}&filetype=${encodeURIComponent(filetype)}`,
      { headers: headers() }
    ),

  blockUser: (userId) =>
    apiFetch(`${API_BASE}/api/user/block/${userId}`, {
      method: "POST",
      headers: headers(),
    }),

  unblockUser: (userId) =>
    apiFetch(`${API_BASE}/api/user/block/${userId}`, {
      method: "DELETE",
      headers: headers(),
    }),

  getBlockStatus: (userId) =>
    apiFetch(`${API_BASE}/api/user/block-status/${userId}`, {
      headers: headers(),
    }),

  deleteAccount: () =>
    apiFetch(`${API_BASE}/api/user/delete`, {
      method: "DELETE",
      headers: headers(),
    }),
};

export { API_BASE };