const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let accessToken = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
let refreshToken = typeof localStorage !== "undefined" ? localStorage.getItem("refreshToken") : null;
let onTokensRefreshed = () => {};

export function setTokens(tokens) {
  accessToken = tokens?.accessToken || null;
  refreshToken = tokens?.refreshToken || null;
  if (typeof localStorage !== "undefined") {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

export function setOnTokensRefreshed(cb) {
  onTokensRefreshed = cb;
}

export function getAccessToken() {
  return accessToken || (typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null);
}

async function rawRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  return res;
}

async function refreshAccessToken() {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Session expired — please log in again");
  const data = await res.json();
  setTokens(data);
  onTokensRefreshed(data);
  return data;
}

/** Authenticated request helper: retries once on 401 by refreshing the access token. */
export async function apiRequest(path, options = {}) {
  let res = await rawRequest(path, options);

  if (res.status === 401 && refreshToken) {
    await refreshAccessToken();
    res = await rawRequest(path, options);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    let msg = body.message;
    if (body.fieldErrors && Object.keys(body.fieldErrors).length > 0) {
      msg = Object.values(body.fieldErrors).join("\n");
    }
    throw new Error(msg || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (body) => apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  verifyEmail: (token) => apiRequest("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),
  login: (body) => apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: (refreshToken) => apiRequest("/api/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),

  me: () => apiRequest("/api/users/me"),
  updateProfile: (body) => apiRequest("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  getPublicKeys: (userId) => apiRequest(`/api/users/${userId}/public-keys`),

  searchUsers: (query) => apiRequest(`/api/friends/search?query=${encodeURIComponent(query)}`),
  sendFriendRequest: (receiverId) => apiRequest("/api/friends/requests", { method: "POST", body: JSON.stringify({ receiverId }) }),
  respondFriendRequest: (id, accept) => apiRequest(`/api/friends/requests/${id}`, { method: "PATCH", body: JSON.stringify({ accept }) }),
  incomingRequests: () => apiRequest("/api/friends/requests/incoming"),
  listFriends: () => apiRequest("/api/friends"),

  listChats: () => apiRequest("/api/chats"),
  getOrCreateDirectChat: (otherUserId) => apiRequest("/api/chats/direct", { method: "POST", body: JSON.stringify({ otherUserId }) }),
  createGroup: (body) => apiRequest("/api/groups", { method: "POST", body: JSON.stringify(body) }),
  getHistory: (chatId, page = 0) => apiRequest(`/api/chats/${chatId}/messages?page=${page}&size=30&sort=createdAt,desc`),
  sendMessage: (body) => apiRequest("/api/chats/messages", { method: "POST", body: JSON.stringify(body) }),
  markSeen: (messageId) => apiRequest(`/api/chats/messages/${messageId}/seen`, { method: "POST" }),

  listNotifications: () => apiRequest("/api/notifications"),
};
