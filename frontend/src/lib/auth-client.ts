import type { UserSerializer, TokenResponseSerializer, LoginSerializer } from "@/types/api";
import Cookies from "js-cookie";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
const SESSION_DAYS = 30;

type RefreshResponse = { access: string; refresh?: string };
type SessionTokens = RefreshResponse & { user?: UserSerializer };

function cookieOptions() {
  return {
    expires: SESSION_DAYS,
    path: "/",
    secure: typeof window !== "undefined" && window.location.protocol === "https:",
    sameSite: "strict" as const,
  };
}

function decodeTokenExpiration(token: string) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).exp as number | undefined;
  } catch {
    return undefined;
  }
}

export function persistAuthSession(tokens: SessionTokens) {
  const options = cookieOptions();
  Cookies.set("access_token", tokens.access, options);
  localStorage.setItem("access_token", tokens.access);

  if (tokens.refresh) {
    Cookies.set("refresh_token", tokens.refresh, options);
    localStorage.setItem("refresh_token", tokens.refresh);
  }

  if (tokens.user) {
    const user = JSON.stringify(tokens.user);
    Cookies.set("user", user, options);
    localStorage.setItem("user", user);
  }
}

export function clearAuthSession() {
  Cookies.remove("access_token", { path: "/" });
  Cookies.remove("refresh_token", { path: "/" });
  Cookies.remove("user", { path: "/" });
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function getStoredRefreshToken() {
  return Cookies.get("refresh_token") || localStorage.getItem("refresh_token") || "";
}

export async function ensureValidAccessToken(forceRefresh = false): Promise<string | null> {
  const access = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
  const expiration = access ? decodeTokenExpiration(access) : undefined;
  const expiresSoon = !expiration || expiration * 1000 - Date.now() < 60_000;

  if (access && !forceRefresh && !expiresSoon) return access;

  const refresh = getStoredRefreshToken();
  if (!refresh) return null;

  const refreshed = await refreshAccessToken(refresh);
  if (!refreshed) return null;
  persistAuthSession(refreshed);
  return refreshed.access;
}

export async function loginUser(email: string, password: string): Promise<TokenResponseSerializer | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    return (await response.json()) as TokenResponseSerializer;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function registerUser(
  email: string,
  username: string,
  password: string,
  password2: string,
  first_name?: string,
  last_name?: string
): Promise<TokenResponseSerializer | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username,
        password,
        password2,
        first_name: first_name || "",
        last_name: last_name || "",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    return (await response.json()) as TokenResponseSerializer;
  } catch (error) {
    console.error("Register error:", error);
    return null;
  }
}

export async function getCurrentUser(token: string): Promise<UserSerializer | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as UserSerializer;
  } catch (error) {
    console.error("Fetch current user error:", error);
    return null;
  }
}

export async function logoutUser(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    return response.ok;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as RefreshResponse;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

/** @deprecated Use refreshAccessToken so rotated refresh tokens are retained. */
export async function refreshToken(refreshToken: string): Promise<string | null> {
  const result = await refreshAccessToken(refreshToken);
  return result?.access ?? null;
}

export async function updateProfile(
  token: string,
  data: (Partial<UserSerializer> & { password?: string }) | FormData
): Promise<UserSerializer | null> {
  try {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${BACKEND_API_URL}/auth/profile/update/`, {
      method: "PUT",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
      },
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as UserSerializer;
  } catch (error) {
    console.error("Profile update error:", error);
    return null;
  }
}
