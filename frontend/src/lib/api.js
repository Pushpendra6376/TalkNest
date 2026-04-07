/**
 * Centralized API client.
 * Every HTTP call in the app goes through this file.
 */

const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:5500";

/* ─── helpers ──────────────────────────────────────────────────────────── */

const getToken = () => localStorage.getItem("auth-token") ?? "";

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  "auth-token": getToken(),
  ...extra,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
};

/* ─── auth ─────────────────────────────────────────────────────────────── */

export const authApi = {
  login: (payload) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  register: (payload) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: headers(),
    }).then(handleResponse),

  sendOtp: (email) =>
    fetch(`${API_BASE}/auth/getotp`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email }),
    }).then(handleResponse),

  sendVerificationOtp: () =>
    fetch(`${API_BASE}/auth/send-verification-otp`, {
      method: "POST",
      headers: headers(),
    }).then(handleResponse),

  verifyEmail: (otp) =>
    fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ otp }),
    }).then(handleResponse),
};

/* ─── conversations ────────────────────────────────────────────────────── */

export const conversationApi = {
  list: () =>
    fetch(`${API_BASE}/conversation/`, {
      headers: headers(),
    }).then(handleResponse),

  get: (id) =>
    fetch(`${API_BASE}/conversation/${id}`, {
      headers: headers(),
    }).then(handleResponse),

  create: (memberIds) =>
    fetch(`${API_BASE}/conversation/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ members: memberIds }),
    }).then(handleResponse),

  togglePin: (id) =>
    fetch(`${API_BASE}/conversation/${id}/pin`, {
      method: "POST",
      headers: headers(),
    }).then(handleResponse),
};

/* ─── messages ─────────────────────────────────────────────────────────── */

export const messageApi = {
  list: (conversationId) =>
    fetch(`${API_BASE}/message/${conversationId}`, {
      headers: headers(),
    }).then(handleResponse),

  delete: (messageId, scope) =>
    fetch(`${API_BASE}/message/${messageId}`, {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ scope }),
    }).then(handleResponse),

  bulkDelete: (messageIds) =>
    fetch(`${API_BASE}/message/bulk/hide`, {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ messageIds }),
    }).then(handleResponse),

  clearChat: (conversationId) =>
    fetch(`${API_BASE}/message/clear/${conversationId}`, {
      method: "POST",
      headers: headers(),
    }).then(handleResponse),

  toggleStar: (messageId) =>
    fetch(`${API_BASE}/message/${messageId}/star`, {
      method: "POST",
      headers: headers(),
    }).then(handleResponse),

  getStarred: () =>
    fetch(`${API_BASE}/message/starred`, {
      headers: headers(),
    }).then(handleResponse),
};

/* ─── users ────────────────────────────────────────────────────────────── */

export const userApi = {
  getOnlineStatus: (userId) =>
    fetch(`${API_BASE}/user/online-status/${userId}`, {
      headers: headers(),
    }).then(handleResponse),

  getNonFriends: (params = {}) => {
    const qs = new URLSearchParams();

    if (params.search) qs.set("search", params.search);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    return fetch(`${API_BASE}/user/non-friends?${qs.toString()}`, {
      headers: headers(),
    }).then(handleResponse);
  },

  updateProfile: (payload) =>
    fetch(`${API_BASE}/user/update`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  getPresignedUrl: (filename, filetype) =>
    fetch(
      `${API_BASE}/user/presigned-url?filename=${encodeURIComponent(
        filename
      )}&filetype=${encodeURIComponent(filetype)}`,
      { headers: headers() }
    ).then(handleResponse),

  blockUser: (userId) =>
    fetch(`${API_BASE}/user/block/${userId}`, {
      method: "POST",
      headers: headers(),
    }).then(handleResponse),

  unblockUser: (userId) =>
    fetch(`${API_BASE}/user/block/${userId}`, {
      method: "DELETE",
      headers: headers(),
    }).then(handleResponse),

  getBlockStatus: (userId) =>
    fetch(`${API_BASE}/user/block-status/${userId}`, {
      headers: headers(),
    }).then(handleResponse),

  deleteAccount: () =>
    fetch(`${API_BASE}/user/delete`, {
      method: "DELETE",
      headers: headers(),
    }).then(handleResponse),
};

export { API_BASE };