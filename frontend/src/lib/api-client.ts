import type { HealthResponse, UserSerializer, TokenResponseSerializer } from "@/types/api";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export async function getActiveModels(token: string) {
  const response = await fetch(`${BACKEND_API_URL}/ai/active-models/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch active models");
  return response.json() as Promise<{ models: Array<{ id: number; model_id: string; display_name: string; provider: string; provider_label: string }> }>;
}


export async function getHealthStatus(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/health/`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Health endpoint failed with status ${response.status}`);
    }

    return (await response.json()) as HealthResponse;
  } catch (error) {
    console.error("Failed to fetch backend health status", error);
    return null;
  }
}

export async function login(email: string, password: string): Promise<TokenResponseSerializer> {
  const response = await fetch(`${BACKEND_API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  return response.json();
}

export async function register(data: Record<string, string>): Promise<UserSerializer> {
  const response = await fetch(`${BACKEND_API_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<UserSerializer> {
  const response = await fetch(`${BACKEND_API_URL}/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${BACKEND_API_URL}/accounts/password-reset/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to request password reset");
  }
}

export async function confirmPasswordReset(uid: string, token: string, new_password: string): Promise<void> {
  const response = await fetch(`${BACKEND_API_URL}/accounts/password-reset-confirm/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token, new_password }),
  });

  if (!response.ok) {
    throw new Error("Failed to reset password. The link might be expired or invalid.");
  }
}

export async function getClients(token: string) {
  const response = await fetch(`${BACKEND_API_URL}/clients/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch clients");
  }

  return response.json();
}

export async function createClient(data: Record<string, any>, token: string) {
  const response = await fetch(`${BACKEND_API_URL}/clients/`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create client");
  }

  return response.json();
}

export async function getClient(id: string | number, token: string) {
  const response = await fetch(`${BACKEND_API_URL}/clients/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch client details");
  }

  return response.json();
}

// ── Chat History API ────────────────────────────────────────────────────────

export async function getConversations(token: string, query?: string, kind = "chat") {
  const params = new URLSearchParams();
  params.set("kind", kind);
  if (query) params.set("q", query);
  const url = `${BACKEND_API_URL}/chat/conversations/?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch conversations");
  return response.json();
}

export async function createConversation(token: string, kind = "chat") {
  const response = await fetch(`${BACKEND_API_URL}/chat/conversations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: kind === "sea" ? "New Task" : "New Conversation", kind }),
  });
  if (!response.ok) throw new Error("Failed to create conversation");
  return response.json();
}

export async function getConversationDetail(id: number, token: string) {
  const response = await fetch(`${BACKEND_API_URL}/chat/conversations/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch conversation details");
  return response.json();
}

export async function updateConversation(id: number, token: string, data: { title?: string, is_pinned?: boolean, folder?: string }) {
  const response = await fetch(`${BACKEND_API_URL}/chat/conversations/${id}/update/`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update conversation");
  return response.json();
}

export async function truncateMessages(messageId: number, token: string) {
  const response = await fetch(`${BACKEND_API_URL}/chat/messages/${messageId}/truncate/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to truncate messages");
  return response.json();
}

export async function deleteConversation(id: number, token: string) {
  const response = await fetch(`${BACKEND_API_URL}/chat/conversations/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete conversation");
}

export async function uploadDocument(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_API_URL}/documents/upload/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload document");
  }
  return response.json();
}

// ── User Memory API ────────────────────────────────────────────────────────

export async function getUserMemory(token: string) {
  const response = await fetch(`${BACKEND_API_URL}/auth/memory/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function updateUserMemory(token: string, context: string) {
  const response = await fetch(`${BACKEND_API_URL}/auth/memory/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ context }),
  });
  if (!response.ok) throw new Error("Failed to update user memory");
  return response.json();
}

// ── Document Library API ───────────────────────────────────────────────────

export async function getDocuments(token: string) {
  const response = await fetch(`${BACKEND_API_URL}/documents/list/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch documents");
  return response.json();
}

export async function deleteDocument(id: string, token: string) {
  const response = await fetch(`${BACKEND_API_URL}/documents/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete document");
}

export async function scrapeUrl(url: string, token: string) {
  const response = await fetch(`${BACKEND_API_URL}/documents/scrape/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error("Failed to scrape URL");
  return response.json();
}
