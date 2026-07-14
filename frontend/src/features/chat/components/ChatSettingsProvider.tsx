"use client";

import { createContext, useContext, ReactNode } from "react";
import { ChatSettings, defaultSettings, useChatSettingsLocal } from "../hooks/useChatSettings";

interface ChatSettingsContextType {
  settings: ChatSettings;
  updateSettings: (updates: Partial<ChatSettings>) => void;
  isLoaded: boolean;
}

const ChatSettingsContext = createContext<ChatSettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  isLoaded: false,
});

export function useChatSettings() {
  return useContext(ChatSettingsContext);
}

export function ChatSettingsProvider({ children }: { children: ReactNode }) {
  const chatSettings = useChatSettingsLocal();

  // Prevent hydration mismatch by not rendering children until settings are loaded from localStorage,
  // or at least render with a hidden class to avoid FOUC.
  // Actually, standard practice for simple apps is to just render, but it might flash.
  // For safety against Next.js hydration errors when HTML differs, we can just render the context.

  return (
    <ChatSettingsContext.Provider value={chatSettings}>
      {/* We apply a small opacity transition to avoid harsh flashes when theme changes on mount */}
      <div
        style={{ opacity: chatSettings.isLoaded ? 1 : 0 }}
        className="transition-opacity duration-300 h-full w-full"
      >
        {children}
      </div>
    </ChatSettingsContext.Provider>
  );
}
