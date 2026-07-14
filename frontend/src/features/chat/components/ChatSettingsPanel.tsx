"use client";

import { Theme, FontFamily, ResponseLength } from "../hooks/useChatSettings";
import { useChatSettings } from "./ChatSettingsProvider";
import { useRole } from "@/features/auth/hooks/useRole";
import { Settings2, X, Palette, Type, MessageSquare, Moon, Sun, Monitor, Paintbrush, User, Database, Info, Bell, UserCircle, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const colors = [
  { value: "from-blue-500 to-cyan-500", label: "Ocean" },
  { value: "from-purple-500 to-pink-500", label: "Berry" },
  { value: "from-amber-500 to-orange-500", label: "Sunset" },
  { value: "from-emerald-500 to-teal-500", label: "Forest" },
  { value: "from-primary to-primary", label: "Monochrome" },
];

const fonts: { value: FontFamily; label: string }[] = [
  { value: "inter", label: "Inter (Sans)" },
  { value: "geist", label: "Geist (Sans)" },
  { value: "mono", label: "Geist Mono" },
  { value: "playfair", label: "Playfair Display" },
  { value: "space", label: "Space Grotesk" },
];

const themes: { value: Theme; label: string; icon: any }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const lengths: { value: ResponseLength; label: string }[] = [
  { value: "short", label: "Short & Concise" },
  { value: "normal", label: "Normal" },
  { value: "detailed", label: "Detailed & Thorough" },
];

type Tab = "General" | "Account" | "Profile" | "AI Personalization" | "Notifications" | "Data" | "About";

export function ChatSettingsPanel({ isOpen, onClose }: Props) {
  const { settings, updateSettings } = useChatSettings();
  const { user } = useRole();
  const [localIdentity, setLocalIdentity] = useState(settings.userIdentity);
  const [localPrompt, setLocalPrompt] = useState(settings.systemPrompt);
  const [activeTab, setActiveTab] = useState<Tab>("General");

  const defaultDisplayName = user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : "";
  const defaultEmail = user?.email ?? "";
  const defaultUsername = user?.first_name ? user.first_name.toLowerCase() : "";

  // Account local state
  const [localEmail, setLocalEmail] = useState(settings.accountEmail || defaultEmail);
  const [localDisplayName, setLocalDisplayName] = useState(settings.accountDisplayName || defaultDisplayName);
  const [localUsername, setLocalUsername] = useState(settings.accountUsername || defaultUsername);

  useEffect(() => {
    setLocalIdentity(settings.userIdentity);
  }, [settings.userIdentity]);

  useEffect(() => {
    setLocalPrompt(settings.systemPrompt);
  }, [settings.systemPrompt]);

  useEffect(() => {
    setLocalEmail(settings.accountEmail || defaultEmail);
    setLocalDisplayName(settings.accountDisplayName || defaultDisplayName);
    setLocalUsername(settings.accountUsername || defaultUsername);
  }, [settings.accountEmail, settings.accountDisplayName, settings.accountUsername, defaultEmail, defaultDisplayName, defaultUsername]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ accountAvatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const TabButton = ({ tab, icon: Icon }: { tab: Tab; icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        activeTab === tab
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {tab}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-4xl h-[600px] max-h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden border border-border relative"
          >
            {/* Sidebar */}
            <div className="w-48 sm:w-64 bg-muted/20 border-r border-border p-4 flex flex-col gap-1 shrink-0">
              <h2 className="text-xl font-semibold mb-6 px-2 mt-2">Settings</h2>
              <div className="flex flex-col gap-1">
                <TabButton tab="General" icon={Settings2} />
                <TabButton tab="Account" icon={UserCircle} />
                <TabButton tab="Profile" icon={User} />
                <TabButton tab="AI Personalization" icon={MessageSquare} />
                <TabButton tab="Notifications" icon={Bell} />
                <TabButton tab="Data" icon={Database} />
                <TabButton tab="About" icon={Info} />
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-card">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-12">
                {activeTab === "General" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="pb-4 border-b border-border">
                      <h3 className="text-lg font-medium">General</h3>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-3 block text-foreground">Theme</label>
                      <div className="grid grid-cols-3 gap-3">
                        {themes.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => updateSettings({ theme: t.value })}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                              settings.theme === t.value
                                ? "bg-muted text-foreground border-border shadow-sm ring-1 ring-ring"
                                : "bg-transparent text-muted-foreground hover:bg-muted/50 border-border"
                            }`}
                          >
                            <t.icon className="w-5 h-5" />
                            <span className="text-sm">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                      <div>
                        <label className="text-sm font-medium mb-3 block text-foreground">Language</label>
                        <select
                          value={settings.language}
                          onChange={(e) => updateSettings({ language: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="System">System Default</option>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-3 block text-foreground">Typography</label>
                        <select
                          value={settings.fontFamily}
                          onChange={(e) => updateSettings({ fontFamily: e.target.value as FontFamily })}
                          className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {fonts.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Account" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="pb-4 border-b border-border flex items-center justify-between">
                      <h3 className="text-lg font-medium">Account Settings</h3>
                      {(localEmail !== settings.accountEmail || localDisplayName !== settings.accountDisplayName || localUsername !== settings.accountUsername) && (
                        <button
                          onClick={() => updateSettings({ 
                            accountEmail: localEmail, 
                            accountDisplayName: localDisplayName, 
                            accountUsername: localUsername 
                          })}
                          className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                          Save Changes
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center relative">
                          {settings.accountAvatarUrl ? (
                            <img src={settings.accountAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-foreground">Profile Picture</h4>
                        <p className="text-sm text-muted-foreground">Upload a square image. JPG, GIF or PNG. Max size of 800K.</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Email Address</label>
                        <input
                          type="email"
                          value={localEmail}
                          onChange={(e) => setLocalEmail(e.target.value)}
                          className="w-full px-4 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block text-foreground">Display Name</label>
                          <input
                            type="text"
                            value={localDisplayName}
                            onChange={(e) => setLocalDisplayName(e.target.value)}
                            className="w-full px-4 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="e.g. Alex"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block text-foreground">Username</label>
                          <input
                            type="text"
                            value={localUsername}
                            onChange={(e) => setLocalUsername(e.target.value)}
                            className="w-full px-4 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="e.g. alex123"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Profile" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="pb-4 border-b border-border">
                      <h3 className="text-lg font-medium">Profile</h3>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex justify-between text-foreground">
                        How should the AI know you?
                        {localIdentity !== settings.userIdentity && (
                          <button
                            onClick={() => updateSettings({ userIdentity: localIdentity })}
                            className="text-xs text-primary hover:underline"
                          >
                            Save changes
                          </button>
                        )}
                      </label>
                      <textarea
                        value={localIdentity}
                        onChange={(e) => setLocalIdentity(e.target.value)}
                        onBlur={() => updateSettings({ userIdentity: localIdentity })}
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        placeholder="e.g. My name is Alex, I'm a senior developer..."
                      />
                    </div>

                    <div className="pt-4 space-y-6">
                      <h4 className="text-sm font-medium text-foreground">AI Identity</h4>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Name</label>
                        <input
                          type="text"
                          value={settings.aiName}
                          onChange={(e) => updateSettings({ aiName: e.target.value })}
                          className="w-full px-4 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. AI Assistant"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Avatar Color</label>
                        <div className="flex flex-wrap gap-3">
                          {colors.map((c) => (
                            <button
                              key={c.value}
                              onClick={() => updateSettings({ aiColor: c.value })}
                              className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.value} ring-offset-background transition-all ${
                                settings.aiColor === c.value ? "ring-2 ring-ring ring-offset-2 scale-110" : "hover:scale-105"
                              }`}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "AI Personalization" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="pb-4 border-b border-border">
                      <h3 className="text-lg font-medium">AI Personalization</h3>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex justify-between text-foreground">
                        System Prompt
                        {localPrompt !== settings.systemPrompt && (
                          <button
                            onClick={() => updateSettings({ systemPrompt: localPrompt })}
                            className="text-xs text-primary hover:underline"
                          >
                            Save changes
                          </button>
                        )}
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        These instructions are injected into every conversation to control the AI's behavior.
                      </p>
                      <textarea
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        onBlur={() => updateSettings({ systemPrompt: localPrompt })}
                        rows={4}
                        className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        placeholder="You are a helpful assistant..."
                      />
                    </div>

                    <div className="pt-2">
                      <label className="text-sm font-medium mb-3 block text-foreground">Response Length</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {lengths.map((l) => (
                          <button
                            key={l.value}
                            onClick={() => updateSettings({ responseLength: l.value as ResponseLength })}
                            className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl border transition-all ${
                              settings.responseLength === l.value
                                ? "bg-muted text-foreground border-border shadow-sm ring-1 ring-ring"
                                : "bg-transparent text-muted-foreground hover:bg-muted/50 border-border"
                            }`}
                          >
                            <span className="text-sm">{l.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Notifications" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="pb-4 border-b border-border">
                      <h3 className="text-lg font-medium">Notifications</h3>
                    </div>

                    <div className="pb-6 border-b border-border flex items-start sm:items-center justify-between gap-6">
                      <div>
                        <h3 className="text-base font-medium text-foreground">Push after AI responded</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Receive a browser push notification when the AI finishes responding in the background.
                        </p>
                      </div>
                      <div className="shrink-0 pt-1 sm:pt-0">
                        <div 
                          onClick={() => updateSettings({ pushNotifications: !settings.pushNotifications })}
                          className={`w-12 h-7 rounded-full flex items-center px-1 cursor-pointer transition-colors ${settings.pushNotifications ? 'bg-blue-500' : 'bg-muted-foreground/30'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Data" && (
                  <div className="space-y-2 max-w-3xl">
                    <div className="pb-6 border-b border-border flex items-start sm:items-center justify-between gap-6">
                      <div>
                        <h3 className="text-base font-medium text-foreground">Improve the model for everyone</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Allow your content to be used to train our models and improve our services. We secure your data privacy.
                        </p>
                      </div>
                      <div className="shrink-0 pt-1 sm:pt-0">
                        {/* Fake switch */}
                        <div className="w-12 h-7 bg-blue-500 rounded-full flex items-center px-1 cursor-pointer transition-colors">
                          <div className="w-5 h-5 bg-white rounded-full translate-x-5 shadow-sm transition-transform" />
                        </div>
                      </div>
                    </div>

                    <div className="py-6 border-b border-border flex items-center justify-between gap-6">
                      <h3 className="text-base font-medium text-foreground">Shared links</h3>
                      <button className="px-5 py-2 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors shrink-0">
                        Manage
                      </button>
                    </div>

                    <div className="py-6 border-b border-border flex items-start sm:items-center justify-between gap-6">
                      <div>
                        <h3 className="text-base font-medium text-foreground">Export data</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                          This data includes your account information and all chat history. Exporting may take some time. The download link will be valid for 7 days.
                        </p>
                      </div>
                      <button className="px-5 py-2 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors shrink-0 pt-1 sm:pt-0 mt-2 sm:mt-0">
                        Export
                      </button>
                    </div>

                    <div className="pt-6 flex items-center justify-between gap-6">
                      <h3 className="text-base font-medium text-foreground">Delete all chats</h3>
                      <button className="px-5 py-2 text-sm font-medium border border-red-500 text-red-500 rounded-full hover:bg-red-500/10 transition-colors shrink-0">
                        Delete all
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "About" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="pb-4 border-b border-border">
                      <h3 className="text-lg font-medium">About</h3>
                    </div>

                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-foreground">AI Chat Platform</strong> v1.0.0
                      </p>
                      <p>
                        A powerful, customizable chat interface designed to give you precise control over your AI interactions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
