"use client";

import { useRole } from "@/features/auth/hooks/useRole";
import { User, Settings, HelpCircle, LogOut, MoreHorizontal, Plus, UserCircle, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useChatSettings } from "./ChatSettingsProvider";

export function UserIdentityCard({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { user, loading } = useRole();
  const { settings } = useChatSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsSubMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="p-4 border-b border-black/10 flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full bg-black/5 animate-pulse shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 bg-black/5 animate-pulse rounded" />
          <div className="h-3 w-32 bg-black/5 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 border-b border-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-black/40" />
          </div>
          <div>
            <p className="text-sm font-medium">Guest User</p>
            <p className="text-xs text-black/50">Not logged in</p>
          </div>
        </div>
      </div>
    );
  }

  const initials = (`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()) || (user.email?.[0]?.toUpperCase() ?? "?");
  
  const finalDisplayName = settings.accountDisplayName || (user.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : (user.email ?? "User"));
  const finalEmail = settings.accountEmail || user.email;
  const avatarUrl = settings.accountAvatarUrl;

  return (
    <div className="relative p-2" ref={menuRef}>
      {/* Menu Popover */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-2 right-2 mb-1 bg-card border border-border shadow-xl rounded-2xl overflow-hidden py-1 z-50">
          {isSubMenuOpen ? (
            <>
              <div className="px-4 py-2.5 flex items-center gap-3 text-muted-foreground">
                <UserCircle className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                <span className="text-sm truncate font-medium">{finalEmail || "Guest User"}</span>
              </div>
              
              <div className="px-4 py-2 flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3 min-w-0 text-left">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${settings.aiColor} text-white flex items-center justify-center font-medium shrink-0 text-xs`}>
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-medium truncate text-foreground">{finalDisplayName}</span>
                </div>
                <Check className="w-4 h-4 text-foreground shrink-0 ml-3" strokeWidth={2} />
              </div>
              
              <div className="h-px bg-border my-1 mx-2" />

              <button
                onClick={() => {
                  setIsSubMenuOpen(false);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted text-foreground transition-colors font-medium"
              >
                <Plus className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                Add account
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsSubMenuOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${settings.aiColor} text-white flex items-center justify-center font-medium shrink-0 text-xs`}>
                      {initials}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium leading-tight">{finalDisplayName}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="h-px bg-border my-1 mx-2" />

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSettings?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted text-foreground transition-colors font-medium"
              >
                <Settings className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                Settings
              </button>
              
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted text-foreground transition-colors font-medium"
              >
                <HelpCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                Help & Feedback
              </button>
              
              <div className="h-px bg-border my-1 mx-2" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted text-foreground transition-colors font-medium"
              >
                <LogOut className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                Log out
              </button>
            </>
          )}
        </div>
      )}

      {/* User Card */}
      <button 
        onClick={() => {
          setIsSubMenuOpen(false);
          setIsMenuOpen(!isMenuOpen);
        }}
        className={`w-full p-2.5 flex items-center justify-between group rounded-xl transition-colors hover:bg-muted/60 ${isMenuOpen ? 'bg-muted/60' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 text-left">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${settings.aiColor} text-white flex items-center justify-center font-medium shrink-0 text-xs`}>
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight text-foreground">{finalDisplayName}</p>
            {finalEmail && <p className="text-xs text-muted-foreground truncate">{finalEmail}</p>}
          </div>
        </div>
        
        <div className="shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity pl-2">
          <MoreHorizontal className="w-5 h-5" />
        </div>
      </button>
    </div>
  );
}
