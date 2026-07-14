"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "@/features/chat/components/ChatInterface";
import { ConversationSidebar } from "@/features/chat/components/ConversationSidebar";
import { ChatSettingsProvider } from "@/features/chat/components/ChatSettingsProvider";
import { ChatSettingsPanel } from "@/features/chat/components/ChatSettingsPanel";
import { SEAInterface } from "@/features/agent/components/SEAInterface";
import Link from "next/link";
import { ArrowLeft, Settings2, PanelLeftClose, PanelLeftOpen, MessageSquare, Bot } from "lucide-react";

type ActiveView = "chat" | "agent";

function ChatPageContent() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusComposerSignal, setFocusComposerSignal] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("chat");

  function handleSelect(id: number) {
    setActiveConversationId(id);
  }

  function handleNew(id: number) {
    setActiveConversationId(id || null);
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
    <div className="flex flex-col h-screen bg-background overflow-hidden relative selection:bg-primary/30">
      
      {/* Dynamic Background Gradients for Glassmorphism */}
      {activeView === "chat" && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>
      )}

      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 bg-background/40 backdrop-blur-md shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          {activeView === "chat" && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}
          {activeView === "chat" && <div className="h-4 w-px bg-border" />}
          
          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
            <button
              onClick={() => setActiveView("chat")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeView === "chat"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Chat
            </button>
            <button
              onClick={() => setActiveView("agent")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
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
              Skilled Eagle Agent
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      {activeView === "chat" ? (
        <div className="flex flex-1 overflow-hidden relative">
          <div 
            className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden border-white/10 ${
              isSidebarOpen ? "w-72 border-r" : "w-0 border-r-0"
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
          <main className="flex flex-1 overflow-hidden">
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
        <div className="flex flex-1 overflow-hidden relative z-10">
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
