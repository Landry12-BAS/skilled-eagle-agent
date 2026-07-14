"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageSquare, Loader2, Search, Pin, PinOff, FolderOpen, Folder, X } from "lucide-react";
import { getConversations, createConversation, deleteConversation, updateConversation } from "@/lib/api-client";
import { UserIdentityCard } from "./UserIdentityCard";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useChatSettings } from "./ChatSettingsProvider";

type Conversation = {
  id: number;
  title: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
  is_pinned: boolean;
  folder: string;
};

interface Props {
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: (id: number) => void;
  onOpenSettings?: () => void;
}

export function ConversationSidebar({ activeId, onSelect, onNew, onOpenSettings }: Props) {
  const { settings } = useChatSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalId, setFolderModalId] = useState<number | null>(null);
  const [folderModalInput, setFolderModalInput] = useState("");
  
  const router = useRouter();

  const token = () => Cookies.get("access_token") || "";

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations(token(), searchQuery);
      setConversations(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchConversations, 0);

    const handleUpdate = () => fetchConversations();
    window.addEventListener("conversationUpdated", handleUpdate);
    return () => {
      window.clearTimeout(initialFetch);
      window.removeEventListener("conversationUpdated", handleUpdate);
    };
  }, [activeId, fetchConversations]);

  async function handleNew() {
    try {
      setCreating(true);
      const conv = await createConversation(token());
      setConversations((prev) => [conv, ...prev]);
      onNew(conv.id);
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    try {
      await deleteConversation(id, token());
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) onNew(0);
    } catch {
      // silently fail
    }
  }

  async function handleTogglePin(e: React.MouseEvent, id: number, currentPinned: boolean) {
    e.stopPropagation();
    try {
      // Optimistic update
      setConversations((prev) => prev.map(c => c.id === id ? { ...c, is_pinned: !currentPinned } : c));
      await updateConversation(id, token(), { is_pinned: !currentPinned });
    } catch {
      // Revert on fail
      setConversations((prev) => prev.map(c => c.id === id ? { ...c, is_pinned: currentPinned } : c));
    }
  }

  function openFolderModal(e: React.MouseEvent, id: number, currentFolder: string) {
    e.stopPropagation();
    setFolderModalId(id);
    setFolderModalInput(currentFolder || "");
    setFolderModalOpen(true);
  }

  function closeFolderModal() {
    setFolderModalOpen(false);
    setFolderModalId(null);
    setFolderModalInput("");
  }

  useEffect(() => {
    if (!folderModalOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFolderModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [folderModalOpen]);

  async function submitFolderModal(e: React.FormEvent) {
    e.preventDefault();
    if (folderModalId === null) return;
    
    const id = folderModalId;
    const newFolder = folderModalInput.trim();
    const prevFolder = conversations.find(c => c.id === id)?.folder || "";
    
    closeFolderModal();

    try {
      setConversations((prev) => prev.map(c => c.id === id ? { ...c, folder: newFolder } : c));
      await updateConversation(id, token(), { folder: newFolder });
    } catch {
      setConversations((prev) => prev.map(c => c.id === id ? { ...c, folder: prevFolder } : c));
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  // Grouping logic
  const pinned = conversations.filter(c => c.is_pinned);
  const unpinned = conversations.filter(c => !c.is_pinned);
  const folders = unpinned.reduce((acc, conv) => {
    const folder = conv.folder?.trim() || "";
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);
  
  // Sort folder names alphabetically, but put empty string ("") first
  const folderNames = Object.keys(folders).sort((a, b) => {
    if (a === "") return -1;
    if (b === "") return 1;
    return a.localeCompare(b);
  });

  const renderConversation = (conv: Conversation) => (
    <motion.div
      key={conv.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(conv.id)}
        onKeyDown={(e) => e.key === "Enter" && onSelect(conv.id)}
        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group relative flex flex-col gap-0.5 cursor-pointer ${
          activeId === conv.id
            ? "bg-primary/20 text-foreground border border-primary/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate pr-16 leading-snug">
            {conv.title}
          </span>
          <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all ${
            activeId === conv.id ? "text-primary/90" : "text-muted-foreground"
          }`}>
            <button
              type="button"
              onClick={(e) => handleTogglePin(e, conv.id, conv.is_pinned)}
              className="p-1.5 rounded-lg hover:bg-background/50 hover:text-foreground transition-all"
              title={conv.is_pinned ? "Unpin chat" : "Pin chat"}
              aria-label={conv.is_pinned ? "Unpin chat" : "Pin chat"}
            >
              {conv.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={(e) => openFolderModal(e, conv.id, conv.folder)}
              className="p-1.5 rounded-lg hover:bg-background/50 hover:text-foreground transition-all"
              title="Move to folder"
              aria-label="Move to folder"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => handleDelete(e, conv.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/20 hover:text-destructive transition-all"
              title="Delete chat"
              aria-label="Delete chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <span className={`text-xs truncate transition-colors ${activeId === conv.id ? "text-primary/80" : "text-muted-foreground"}`}>
          {formatDate(conv.updated_at)}
          {conv.message_count > 0 && ` · ${conv.message_count} messages`}
        </span>
      </div>
    </motion.div>
  );

  return (
    <aside className="flex flex-col w-full h-full bg-background/60 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <button
          onClick={handleNew}
          disabled={creating}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br ${settings.aiColor} text-white text-sm font-medium hover:opacity-90 transition-all shadow-md disabled:opacity-60`}
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Chat
        </button>
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 py-12">
            <MessageSquare className="w-8 h-8 opacity-50" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {pinned.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Pin className="w-3 h-3" /> Pinned
                  </div>
                  <div className="space-y-1">{pinned.map(renderConversation)}</div>
                </div>
              )}
              
              {folderNames.map(folder => (
                <div key={folder} className="mb-4">
                  {folder && (
                    <div className="px-3 mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Folder className="w-3 h-3" /> {folder}
                    </div>
                  )}
                  <div className="space-y-1">{folders[folder].map(renderConversation)}</div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Identity (Moved to bottom) */}
      <div className="mt-auto border-t border-border/50 bg-muted/20">
        <UserIdentityCard onOpenSettings={onOpenSettings} />
      </div>

      {/* Folder Modal */}
      <AnimatePresence>
        {folderModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeFolderModal}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border shadow-2xl rounded-xl z-50 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="folder-dialog-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 id="folder-dialog-title" className="font-semibold">Move to Folder</h3>
                <button
                  type="button"
                  onClick={closeFolderModal}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close folder dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={submitFolderModal} className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="folderName" className="text-sm text-muted-foreground">
                    Enter folder name (leave blank to remove)
                  </label>
                  <input
                    id="folderName"
                    type="text"
                    autoFocus
                    value={folderModalInput}
                    onChange={(e) => setFolderModalInput(e.target.value)}
                    maxLength={50}
                    placeholder="e.g. Project X, Marketing"
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeFolderModal}
                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </aside>
  );
}
