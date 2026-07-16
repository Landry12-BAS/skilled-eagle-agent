"use client";

import { useEffect } from "react";
import { ensureValidAccessToken } from "@/lib/auth-client";

export function SessionRenewal() {
  useEffect(() => {
    const renew = () => { void ensureValidAccessToken(); };
    renew();
    const interval = window.setInterval(renew, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
