"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "@/features/chat/components/ChatInterface";
import { ConversationSidebar } from "@/features/chat/components/ConversationSidebar";
import { ChatSettingsProvider } from "@/features/chat/components/ChatSettingsProvider";
import { ChatSettingsPanel } from "@/features/chat/components/ChatSettingsPanel";
import { SEAInterface } from "@/features/agent/components/SEAInterface";
import Link from "next/link";
import { ArrowLeft, Settings2, PanelLeft, MessageSquare, Bot } from "lucide-react";

type ActiveView = "chat" | "agent";

function ChatPageContent() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusComposerSignal, setFocusComposerSignal] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("chat");

  function handleSelect(id: number) {
    setActiveConversationId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }

  function handleNew(id: number) {
    setActiveConversationId(id || null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }

  function handleConversationCreated(id: number) {
    setActiveConversationId(id);
  }

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveConversationId(null);
        setFocusComposerSignal((signal) => signal + 1);
      }
      if (e.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background selection:bg-primary/30">
      
      {/* Dynamic Background Gradients for Glassmorphism */}
      {activeView === "chat" && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>
      )}

      {/* Top bar */}
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-background/80 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="hidden h-4 w-px bg-border sm:block" />
          {activeView === "chat" && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-pressed={isSidebarOpen}
            >
              <PanelLeft className="h-5 w-5" strokeWidth={1.8} />
            </button>
          )}
          {activeView === "chat" && <div className="hidden h-4 w-px bg-border sm:block" />}
          
          {/* View Tabs */}
          <div className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg bg-muted/30 p-0.5">
            <button
              onClick={() => setActiveView("chat")}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm ${
                activeView === "chat"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Chat</span>
            </button>
            <button
              onClick={() => setActiveView("agent")}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm ${
                activeView === "agent"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <img 
                src="/logo.png" 
                className="hidden dark:block h-3.5 object-contain" 
                alt="" 
              />
              <img 
                src="/logo-light.png" 
                className="block dark:hidden h-3.5 object-contain" 
                alt="" 
              />
              <span className="sm:hidden">SEA</span>
              <span className="hidden sm:inline">Skilled Eagle Agent</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      {activeView === "chat" ? (
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {isSidebarOpen && (
            <button
              type="button"
              aria-label="Close conversations"
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden"
            />
          )}
          <div
            className={`absolute inset-y-0 left-0 z-40 shrink-0 overflow-hidden border-white/10 bg-background shadow-2xl transition-all duration-300 ease-in-out md:relative md:z-auto md:shadow-none ${
              isSidebarOpen ? "w-72 translate-x-0 border-r" : "w-72 -translate-x-full border-r-0 md:w-0 md:translate-x-0"
            }`}
          >
            <div className="w-72 h-full">
              <ConversationSidebar
                activeId={activeConversationId}
                onSelect={handleSelect}
                onNew={handleNew}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          </div>
          <main className="flex min-w-0 flex-1 overflow-hidden">
            <ChatInterface
              conversationId={activeConversationId}
              onConversationCreated={handleConversationCreated}
              focusComposerSignal={focusComposerSignal}
            />
          </main>

          <ChatSettingsPanel 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        </div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
          <SEAInterface onOpenSettings={() => setIsSettingsOpen(true)} />
          <ChatSettingsPanel 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatSettingsProvider>
      <ChatPageContent />
    </ChatSettingsProvider>
  );
}
