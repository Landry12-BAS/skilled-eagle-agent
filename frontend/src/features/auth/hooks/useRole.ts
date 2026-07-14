"use client";

import { useEffect, useState } from "react";

type Role = "admin" | "manager" | "viewer" | null;

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  bio: string;
}

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000/api";

export function useRole() {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_API_URL}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setRole(data.role || "viewer");
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    role,
    user,
    loading,
    isAdmin: role === "admin",
    isManager: role === "admin" || role === "manager",
    isViewer: role === "viewer",
    canEdit: role === "admin" || role === "manager",
    canDelete: role === "admin",
  };
}
