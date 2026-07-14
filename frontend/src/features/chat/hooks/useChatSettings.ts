import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";
export type FontFamily = "inter" | "geist" | "mono" | "playfair" | "space";
export type ResponseLength = "short" | "normal" | "detailed";

export interface ChatSettings {
  aiName: string;
  aiColor: string; // Tailwind class like "from-purple-500 to-indigo-500"
  systemPrompt: string;
  userIdentity: string;
  theme: Theme;
  fontFamily: FontFamily;
  language: string;
  responseLength: ResponseLength;
  pushNotifications: boolean;
  accountEmail: string;
  accountDisplayName: string;
  accountUsername: string;
  accountAvatarUrl: string;
}

export const defaultSettings: ChatSettings = {
  aiName: "AI Assistant",
  aiColor: "from-primary to-primary",
  systemPrompt: "You are an expert AI consultant and senior developer for Skilled Eagle. Provide highly structured, actionable, and opinionated answers. Always use rich markdown (tables, bold text, lists) and tasteful emojis.",
  userIdentity: "",
  theme: "system",
  fontFamily: "inter",
  language: "English",
  responseLength: "normal",
  pushNotifications: false,
  accountEmail: "",
  accountDisplayName: "",
  accountUsername: "",
  accountAvatarUrl: "",
};

import { getUserMemory, updateUserMemory } from "@/lib/api-client";
import Cookies from "js-cookie";

export function useChatSettingsLocal() {
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage and backend on mount
  useEffect(() => {
    let currentSettings = { ...defaultSettings };
    try {
      const stored = localStorage.getItem("chat_settings");
      if (stored) {
        currentSettings = { ...currentSettings, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    
    // Also fetch from backend memory asynchronously
    const token = Cookies.get("access_token");
    if (token) {
      getUserMemory(token).then((mem) => {
        if (mem && mem.context) {
          setSettings((s) => ({ ...s, userIdentity: mem.context }));
        }
      }).catch(() => {});
    }
    
    setSettings(currentSettings);
    setIsLoaded(true);
  }, []);

  // Save to localStorage when settings change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("chat_settings", JSON.stringify(settings));

    // Apply Theme
    const root = window.document.documentElement;
    root.classList.remove("dark");
    if (
      settings.theme === "dark" ||
      (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      root.classList.add("dark");
    }

    // Apply Font
    root.classList.remove(
      "font-override-inter",
      "font-override-geist",
      "font-override-mono",
      "font-override-playfair",
      "font-override-space"
    );
    root.classList.add(`font-override-${settings.fontFamily}`);
  }, [settings, isLoaded]);

  // Listen for system theme changes if set to "system"
  useEffect(() => {
    if (settings.theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const root = window.document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [settings.theme]);

  const updateSettings = (updates: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      // Sync memory to backend if it changed, using a timeout debounce trick
      if (updates.userIdentity !== undefined && updates.userIdentity !== prev.userIdentity) {
        const token = Cookies.get("access_token");
        if (token) {
          if ((window as any)._memorySaveTimeout) {
            clearTimeout((window as any)._memorySaveTimeout);
          }
          (window as any)._memorySaveTimeout = setTimeout(() => {
            updateUserMemory(token, updates.userIdentity!).catch(() => {});
          }, 1000);
        }
      }
      return next;
    });
  };

  return { settings, updateSettings, isLoaded };
}
