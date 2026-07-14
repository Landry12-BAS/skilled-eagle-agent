import type { UserSerializer, TokenResponseSerializer, LoginSerializer } from "@/types/api";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

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

export async function refreshToken(refreshToken: string): Promise<string | null> {
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

    const data = await response.json();
    return data.access;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
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
