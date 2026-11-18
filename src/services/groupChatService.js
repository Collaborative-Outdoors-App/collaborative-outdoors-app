import { auth } from "../firebase/firebaseConfig";

const API_URL = process.env.EXPO_PUBLIC_GROUP_CHAT_API_URL;

function getApiUrl() {
  if (!API_URL) {
    throw new Error("Group chat API is not configured. Set EXPO_PUBLIC_GROUP_CHAT_API_URL and restart the app.");
  }

  const url = new URL(API_URL);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("The group chat API URL must use HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("The group chat API URL must not contain credentials, query parameters, or a fragment.");
  }

  return url.toString().replace(/\/+$/, "");
}

async function request(path, options = {}) {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error("Sign in before using group chat.");
  }

  const token = await user.getIdToken();
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Group chat API request failed (${response.status}): ${body || response.statusText}`);
  }

  return response.json();
}

export function isGroupChatApiConfigured() {
  return Boolean(API_URL);
}

export async function getRemoteGroups() {
  return request("/groups");
}

export async function createRemoteGroup(name) {
  return request("/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getGroupMessages(groupId, { limit = 50, cursor } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return request(`/groups/${encodeURIComponent(groupId)}/messages?${params.toString()}`);
}

export async function sendGroupMessage(groupId, text) {
  return request(`/groups/${encodeURIComponent(groupId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
