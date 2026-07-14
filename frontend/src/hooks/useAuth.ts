"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserSerializer } from "@/types/api";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "@/lib/auth-client";
import Cookies from "js-cookie";

export interface AuthState {
  isAuthenticated: boolean;
  user: UserSerializer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string, password2: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  // Initialize from cookies on mount
  useEffect(() => {
    const accessToken = Cookies.get("access_token");
    const refreshToken = Cookies.get("refresh_token");
    const userStr = Cookies.get("user");

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Sync localStorage with valid cookies on mount
        localStorage.setItem("access_token", accessToken);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("user", userStr);

        setState({
          isAuthenticated: true,
          user,
          accessToken,
          refreshToken: refreshToken || null,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await loginUser(email, password);

    if (result) {
      const isSecure = window.location.protocol === "https:";
      Cookies.set("access_token", result.access, { secure: isSecure, sameSite: "strict", expires: 1/24 }); // 1 hour
      Cookies.set("refresh_token", result.refresh, { secure: isSecure, sameSite: "strict", expires: 1 }); // 1 day
      Cookies.set("user", JSON.stringify(result.user), { secure: isSecure, sameSite: "strict", expires: 1 });

      localStorage.setItem("access_token", result.access);
      localStorage.setItem("refresh_token", result.refresh);
      localStorage.setItem("user", JSON.stringify(result.user));

      setState({
        isAuthenticated: true,
        user: result.user,
        accessToken: result.access,
        refreshToken: result.refresh,
        isLoading: false,
        error: null,
      });
      return true;
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Login failed. Please check your credentials.",
      }));
      return false;
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      username: string,
      password: string,
      password2: string,
      firstName?: string,
      lastName?: string
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = await registerUser(email, username, password, password2, firstName, lastName);

      if (result) {
        const isSecure = window.location.protocol === "https:";
        Cookies.set("access_token", result.access, { secure: isSecure, sameSite: "strict", expires: 1/24 });
        Cookies.set("refresh_token", result.refresh, { secure: isSecure, sameSite: "strict", expires: 1 });
        Cookies.set("user", JSON.stringify(result.user), { secure: isSecure, sameSite: "strict", expires: 1 });

        localStorage.setItem("access_token", result.access);
        localStorage.setItem("refresh_token", result.refresh);
        localStorage.setItem("user", JSON.stringify(result.user));

        setState({
          isAuthenticated: true,
          user: result.user,
          accessToken: result.access,
          refreshToken: result.refresh,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Registration failed. Please try again.",
        }));
        return false;
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = Cookies.get("refresh_token");
    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user");

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    clearError,
  };
}
