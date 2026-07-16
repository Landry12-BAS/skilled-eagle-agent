"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserSerializer } from "@/types/api";
import { clearAuthSession, ensureValidAccessToken, getStoredRefreshToken, loginUser, registerUser, logoutUser, persistAuthSession } from "@/lib/auth-client";
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

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const accessToken = await ensureValidAccessToken();
      const refreshToken = getStoredRefreshToken();
      const userStr = Cookies.get("user") || localStorage.getItem("user");

      if (!accessToken || !userStr) {
        if (!cancelled) setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const user = JSON.parse(userStr) as UserSerializer;
        persistAuthSession({ access: accessToken, refresh: refreshToken, user });
        if (!cancelled) {
          setState({ isAuthenticated: true, user, accessToken, refreshToken: refreshToken || null, isLoading: false, error: null });
        }
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await loginUser(email, password);

    if (result) {
      persistAuthSession(result);

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
        persistAuthSession(result);

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
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    clearAuthSession();

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
