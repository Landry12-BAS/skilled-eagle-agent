"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Bug, BookOpen, TestTube2, RefreshCw, Loader2, FileCode2, ChevronDown, ChevronUp, Plus, FolderOpen, FilePlus2, Sparkles, ThumbsUp, ThumbsDown, Copy, CheckCircle2, ArrowUpRight, Undo2, Eye, FilePenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { useChatSettings } from "@/features/chat/components/ChatSettingsProvider";
import { loadGitHubAccount, loadGitHubToken } from "./githubConnection";
import { getActiveModels, getConversationDetail } from "@/lib/api-client";
import { RichMarkdown } from "@/components/chat/RichMarkdown";

interface FileEdit {
  path: string;
  additions: number;
  deletions: number;
  prevContent?: string;
  newContent?: string;
}

interface ToolResultCard {
  id: string;
  type: "file_edits";
  files: FileEdit[];
  timestamp: Date;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  toolResult?: ToolResultCard;
}

interface ActiveModel {
  id: number;
  model_id: string;
  display_name: string;
  provider: string;
  provider_label: string;
}

interface ConversationHistoryMessage {
  id: string | number;
  role: "user" | "assistant" | "agent";
  content: string;
}

interface ActiveFile {
  path: string;
  content: string;
  language: string;
}

interface AgentChatProps {
  conversationId?: number | null;
  activeFile: ActiveFile | null;
  workspaceFiles?: ActiveFile[];
  onOpenFolder?: () => void;
  onAddFiles?: () => void;
  onNewProject?: () => void;
  initialPrompt?: string;
  enabledPlugins?: string[];
  githubContext?: { repository?: string; branch?: string } | null;
  onConversationCreated?: (id: number) => void;
  onReviewFile?: (file: ActiveFile) => void;
}

const DEFAULT_AGENT_MESSAGE: Message = {
  id: "1",
  role: "agent",
  content: "Hi! I'm SEA — your Skilled Eagle coding agent. I can help you understand, debug, and improve your codebase. Select a file or ask me anything!"
};

function languageFor(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() || "text";
  return ({ ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx", py: "python", json: "json", md: "markdown", css: "css", html: "html" } as Record<string, string>)[extension] || extension;
}

export function AgentChat({ conversationId, activeFile, workspaceFiles = [], onOpenFolder, onAddFiles, onNewProject, initialPrompt = "", enabledPlugins = [], githubContext = null, onConversationCreated, onReviewFile }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([DEFAULT_AGENT_MESSAGE]);
  const [input, setInput] = useState(initialPrompt);
  const [connected, setConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<ActiveModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [status, setStatus] = useState("Connecting");
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down' | null>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [undoneCards, setUndoneCards] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { settings } = useChatSettings();
  const streamingMessageIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<number | null>(null);
  // Track pending file edits during a tool loop
  const pendingFileEditsRef = useRef<FileEdit[]>([]);

  useEffect(() => {
    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) return;
    getActiveModels(token)
      .then((data) => setAvailableModels(data.models))
      .catch(() => setAvailableModels([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (conversationId) {
      async function loadHistory() {
        const token = Cookies.get("access_token") || localStorage.getItem("access_token");
        if (!token) return;
        setStatus("Loading history...");
        try {
          const detail = await getConversationDetail(conversationId as number, token);
          if (!cancelled && detail && detail.messages) {
            const historyMessages = (detail.messages as ConversationHistoryMessage[]).map((m) => ({
              id: m.id.toString(),
              role: m.role === "assistant" || m.role === "agent" ? "agent" : "user",
              content: m.content
            })) satisfies Message[];
            setMessages(historyMessages.length > 0 ? historyMessages : [DEFAULT_AGENT_MESSAGE]);
            conversationIdRef.current = conversationId ?? null;
            setStatus("Ready");
          }
        } catch (e) {
          console.error(e);
          if (!cancelled) setStatus("Failed to load history");
        }
      }
      loadHistory();
    } else {
      const resetTimer = window.setTimeout(() => {
        if (cancelled) return;
        setMessages([DEFAULT_AGENT_MESSAGE]);
        conversationIdRef.current = null;
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(resetTimer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    let reconnectTimeout: number;
    let isCancelled = false;

    const connectWs = () => {
      const token = Cookies.get("access_token") || localStorage.getItem("access_token");
      if (!token) {
        setStatus("Sign in required");
        return;
      }

      const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "");
      const socket = new WebSocket(`${baseUrl}/ws/sea/?token=${encodeURIComponent(token)}`);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isCancelled) {
          socket.close();
          return;
        }
        setConnected(true);
        setStatus("Ready");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const messageId = streamingMessageIdRef.current;

        if (data.type === "status") {
          setStatus(data.content);
        } else if (data.type === "token" && messageId) {
          setStatus("Working");
          setMessages((previous) => previous.map((message) => {
            if (message.id === messageId) {
              const newContent = message.content + data.content;
              const cleanContent = newContent.split(/Action:/i)[0];
              return { ...message, content: cleanContent };
            }
            return message;
          }));
        } else if (data.type === "tool_start") {
          if (data.tool === "write_file") {
            (socket as WebSocket & { _pendingWriteArgs?: Record<string, string> })._pendingWriteArgs = data.arguments;
          }
        } else if (data.type === "tool_done") {
          if (data.tool === "write_file") {
            const args = (socket as WebSocket & { _pendingWriteArgs?: Record<string, string> })._pendingWriteArgs || {};
            const path: string = args.path || args.file_path || "unknown";
            const newContent: string = args.content || "";
            const lines = newContent.split("\n").length;
            pendingFileEditsRef.current = [
              ...pendingFileEditsRef.current,
              { path, additions: lines, deletions: 0, newContent },
            ];
          }
        } else if (data.type === "done") {
          const createdConversationId = typeof data.conversation_id === "number" ? data.conversation_id : null;
          if (createdConversationId && conversationIdRef.current !== createdConversationId) {
            conversationIdRef.current = createdConversationId;
            onConversationCreated?.(createdConversationId);
          }
          window.dispatchEvent(new Event("conversationUpdated"));
          streamingMessageIdRef.current = null;
          setIsStreaming(false);
          setStatus("Ready");
          const edits = pendingFileEditsRef.current;
          pendingFileEditsRef.current = [];
          if (edits.length > 0) {
            const cardId = `card-${Date.now()}`;
            const card: ToolResultCard = { id: cardId, type: "file_edits", files: edits, timestamp: new Date() };
            edits.forEach((edit) => {
              if (edit.newContent !== undefined) {
                onReviewFile?.({ path: edit.path, content: edit.newContent, language: languageFor(edit.path) });
              }
            });
            setMessages((prev) => {
              const idx = [...prev].reverse().findIndex((m) => m.role === "agent");
              if (idx === -1) return prev;
              const realIdx = prev.length - 1 - idx;
              return prev.map((m, i) => i === realIdx ? { ...m, toolResult: card } : m);
            });
          }
        } else if (data.type === "error" && messageId) {
          setMessages((previous) => previous.map((message) =>
            message.id === messageId ? { ...message, content: `Error: ${data.content}` } : message
          ));
          streamingMessageIdRef.current = null;
          setIsStreaming(false);
          setStatus("Error");
        }
      };

      socket.onerror = () => {
        if (!isCancelled) setStatus("Connection error");
      };

      socket.onclose = () => {
        if (isCancelled) return;
        setConnected(false);
        setIsStreaming(false);
        setStatus("Reconnecting...");
        reconnectTimeout = window.setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      isCancelled = true;
      window.clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const question = input.trim();
    const socket = wsRef.current;
    if (!question || isStreaming || !socket || socket.readyState !== WebSocket.OPEN) return;

    const userMessage: Message = { id: `${Date.now()}-user`, role: "user", content: question };
    const agentMessage: Message = { id: `${Date.now()}-agent`, role: "agent", content: "" };
    const priorMessages = messages.slice(-8).map((message) => ({
      role: message.role === "agent" ? "assistant" : "user",
      content: message.content,
    }));
    const contextFiles = activeFile ? [activeFile] : workspaceFiles.slice(0, 20);
    const fileContext = contextFiles.length > 0
      ? contextFiles.map((file) =>
          `File: ${file.path}\nLanguage: ${file.language}\n\n\`\`\`${file.language}\n${file.content.slice(0, Math.max(1000, Math.floor(30000 / contextFiles.length)))}\n\`\`\``
        ).join("\n\n")
      : "No file is currently selected. Ask the user to select a file when code context is required.";
    const githubToken = loadGitHubToken();
    const githubAccount = loadGitHubAccount();
    const pluginContext = [
      `Enabled capabilities: ${enabledPlugins.join(", ") || "none"}.`,
      githubToken ? [
        `GitHub is connected${githubAccount ? ` as @${githubAccount}` : ""}.`,
        githubContext?.repository ? `Selected GitHub repository: ${githubContext.repository}` : "No GitHub repository is selected yet.",
        githubContext?.branch ? `Selected GitHub branch: ${githubContext.branch}` : "No GitHub branch is selected yet.",
        "When the user asks about GitHub repositories or folders, use the available GitHub tools before asking for repository details.",
      ].join("\n") : "",
    ].filter(Boolean).join("\n");

    streamingMessageIdRef.current = agentMessage.id;
    setMessages((previous) => [...previous, userMessage, agentMessage]);
    setInput("");
    setIsStreaming(true);
    setStatus("Working");
    socket.send(JSON.stringify({
      conversation_id: conversationIdRef.current,
      display_message: question,
      model_id: selectedModelId,
      effort: "medium",
      github_context: githubToken ? {
        token: githubToken,
        account: githubAccount,
        repository: githubContext?.repository || "",
        branch: githubContext?.branch || "",
      } : null,
      messages: [
        {
          role: "system",
          content: `You are SEA, the Skilled Eagle coding agent. Analyze the supplied active file precisely. Give concise, actionable engineering answers. Never claim to have changed code unless a change was actually applied. Enabled capabilities: ${enabledPlugins.join(", ") || "none"}.`,
        },
        ...priorMessages,
        { role: "user", content: `${pluginContext}\n\n${fileContext}\n\nRequest: ${question}` },
      ],
    }));
  };

  const handleActionClick = (action: string) => {
    setInput(action);
  };

  const handleContinue = () => {
    const socket = wsRef.current;
    if (isStreaming || !socket || socket.readyState !== WebSocket.OPEN) return;
    const githubToken = loadGitHubToken();
    const githubAccount = loadGitHubAccount();

    const userMessage: Message = { id: `${Date.now()}-user`, role: "user", content: "Continue" };
    const agentMessage: Message = { id: `${Date.now()}-agent`, role: "agent", content: "" };
    const priorMessages = messages.slice(-8).map((message) => ({
      role: message.role === "agent" ? "assistant" : "user",
      content: message.content,
    }));

    streamingMessageIdRef.current = agentMessage.id;
    setMessages((previous) => [...previous, userMessage, agentMessage]);
    setIsStreaming(true);
    setStatus("Working");
    socket.send(JSON.stringify({
      conversation_id: conversationIdRef.current,
      display_message: "Continue",
      model_id: selectedModelId,
      effort: "medium",
      github_context: githubToken ? {
        token: githubToken,
        account: githubAccount,
        repository: githubContext?.repository || "",
        branch: githubContext?.branch || "",
      } : null,
      messages: [
        ...priorMessages,
        { role: "user", content: "Continue from where you left off." },
      ],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background">

      {activeFile && (
        <div className="h-8 px-3 flex items-center gap-2 border-b border-border bg-muted/50 text-[11px] text-muted-foreground font-mono shrink-0">
          <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="truncate">{activeFile.path}</span>
          <span className="ml-auto text-muted-foreground">in context</span>
        </div>
      )}

      {/* Powered by Skilled Eagle Header */}
      <div className="p-4 border-b border-border/50 bg-background flex items-center justify-between shrink-0 shadow-sm">
        <div>
          <h2 className="font-semibold text-foreground">{settings.aiName || "SEA Assistant"}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Powered by SKILLED EAGLE</p>
            <img 
              src="/logo.png" 
              className="hidden dark:block h-3.5 object-contain" 
              alt="Skilled Eagle" 
            />
            <img 
              src="/logo-light.png" 
              className="block dark:hidden h-3.5 object-contain" 
              alt="Skilled Eagle" 
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
            {status}
          </div>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "agent" && (
                <div className={`w-6 h-6 rounded-md text-foreground flex items-center justify-center shrink-0 mt-0.5 bg-gradient-to-br ${settings.aiColor}`}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`min-w-0 text-[13px] leading-6 flex flex-col ${
                msg.role === "user"
                  ? "max-w-[88%] bg-primary text-foreground rounded-xl rounded-br-sm px-3.5 py-2 border border-border sm:max-w-[78%]"
                  : "text-foreground/80 pt-0.5"
              }`}>
                {msg.content ? <RichMarkdown content={msg.content} /> : (isStreaming ? <span>Analyzing…</span> : null)}
                
                             {msg.role === "agent" && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-border opacity-70">
                    <button 
                      onClick={() => setFeedbackState(prev => ({ ...prev, [msg.id]: prev[msg.id] === 'up' ? null : 'up' }))}
                      className={`p-1.5 rounded-md hover:bg-accent transition-colors ${feedbackState[msg.id] === 'up' ? 'text-green-400 bg-green-400/10' : 'text-foreground/50'}`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setFeedbackState(prev => ({ ...prev, [msg.id]: prev[msg.id] === 'down' ? null : 'down' }))}
                      className={`p-1.5 rounded-md hover:bg-accent transition-colors ${feedbackState[msg.id] === 'down' ? 'text-red-400 bg-red-400/10' : 'text-foreground/50'}`}
                      title="Poor response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        setCopiedId(msg.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-foreground/50"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {/* Continue in new task — only on last agent message */}
                    {msg.id === [...messages].reverse().find((m) => m.role === "agent")?.id &&
                      !isStreaming && msg.content.length > 0 && (
                      <button
                        onClick={handleContinue}
                        className="ml-auto p-1.5 rounded-md hover:bg-accent transition-colors text-foreground/50 hover:text-foreground group"
                        title="Continue in new task"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    )}
                    <span className="text-[10px] text-foreground/30 ml-auto">
                      {new Date().toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Rich File Edit Card */}
                {msg.role === "agent" && msg.toolResult && msg.toolResult.type === "file_edits" && (() => {
                  const card = msg.toolResult;
                  const isExpanded = expandedCards[card.id];
                  const isUndone = undoneCards[card.id];
                  const totalAdditions = card.files.reduce((sum, f) => sum + f.additions, 0);
                  const totalDeletions = card.files.reduce((sum, f) => sum + f.deletions, 0);
                  const visibleFiles = isExpanded ? card.files : card.files.slice(0, 3);
                  const hiddenCount = card.files.length - 3;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 rounded-xl border border-border bg-card overflow-hidden shadow-sm ${
                        isUndone ? "opacity-50" : ""
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FilePenLine className="w-4 h-4 text-foreground/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground">
                            {isUndone ? "Changes reverted" : `Edited ${card.files.length} file${card.files.length > 1 ? "s" : ""}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            <span className="text-emerald-500 font-mono">+{totalAdditions}</span>
                            {" "}
                            <span className="text-red-400 font-mono">-{totalDeletions}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!isUndone && (
                            <button
                              onClick={() => setUndoneCards(prev => ({ ...prev, [card.id]: true }))}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-colors"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Undo
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const firstFile = card.files[0];
                              if (firstFile?.newContent !== undefined) {
                                onReviewFile?.({ path: firstFile.path, content: firstFile.newContent, language: languageFor(firstFile.path) });
                              }
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-foreground bg-muted hover:bg-accent border border-border transition-colors font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </div>
                      </div>

                      {/* File List */}
                      <div className="divide-y divide-border/50">
                        {visibleFiles.map((file) => (
                          <button
                            key={file.path}
                            type="button"
                            onClick={() => {
                              if (file.newContent !== undefined) {
                                onReviewFile?.({ path: file.path, content: file.newContent, language: languageFor(file.path) });
                              }
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[12px] font-mono hover:bg-accent/40"
                          >
                            <span className="text-muted-foreground truncate flex-1">
                              {file.path.includes("/") ? (
                                <>
                                  <span>{file.path.substring(0, file.path.lastIndexOf("/") + 1)}</span>
                                  <span className="text-foreground font-semibold">{file.path.substring(file.path.lastIndexOf("/") + 1)}</span>
                                </>
                              ) : (
                                <span className="text-foreground font-semibold">{file.path}</span>
                              )}
                            </span>
                            <span className="shrink-0 text-emerald-500">+{file.additions}</span>
                            <span className="shrink-0 text-red-400">-{file.deletions}</span>
                          </button>
                        ))}
                      </div>

                      {/* Show more / less */}
                      {card.files.length > 3 && (
                        <button
                          onClick={() => setExpandedCards(prev => ({ ...prev, [card.id]: !isExpanded }))}
                          className="w-full flex items-center gap-1.5 px-4 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors border-t border-border"
                        >
                          {isExpanded ? (
                            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                          ) : (
                            <><ChevronDown className="w-3.5 h-3.5" /> Show {hiddenCount} more file{hiddenCount > 1 ? "s" : ""}</>
                          )}
                        </button>
                      )}
                    </motion.div>
                  );
                })()}
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-3 pb-3 pt-2 sm:px-6 sm:pb-4">
        <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          <button onClick={() => handleActionClick("Can you fix the bug in this file?")} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 hover:bg-accent border border-border text-[11px] text-muted-foreground transition-colors">
            <Bug className="w-3 h-3 text-red-400" />
            Fix Bug
          </button>
          <button onClick={() => handleActionClick("Please explain this code to me.")} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 hover:bg-accent border border-border text-[11px] text-muted-foreground transition-colors">
            <BookOpen className="w-3 h-3 text-blue-400" />
            Explain
          </button>
          <button onClick={() => handleActionClick("Write unit tests for this module.")} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 hover:bg-accent border border-border text-[11px] text-muted-foreground transition-colors">
            <TestTube2 className="w-3 h-3 text-emerald-400" />
            Write Tests
          </button>
          <button onClick={() => handleActionClick("Refactor this code to be more efficient.")} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 hover:bg-accent border border-border text-[11px] text-muted-foreground transition-colors">
            <RefreshCw className="w-3 h-3 text-purple-400" />
            Refactor
          </button>
        </div>
        
        <form onSubmit={handleSend} className="relative min-w-0 rounded-xl bg-card border border-border focus-within:border-border shadow-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask SEA to explain, edit, or run something…"
            rows={3}
            className="w-full resize-none bg-transparent px-3.5 pt-3 text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-[13px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 pb-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <button type="button" onClick={() => setContextMenuOpen((open) => !open)} className="p-1 rounded hover:bg-accent" title="Add context" aria-label="Add context">
                <Plus className="w-3.5 h-3.5" />
              </button>
              {workspaceFiles.length > 0 && (
                <span className="flex items-center gap-1 text-blue-300/70">
                  <FileCode2 className="w-3 h-3" /> {workspaceFiles.length} files
                </span>
              )}
              <button type="button" onClick={() => setModelOpen((open) => !open)} className="flex min-w-0 max-w-[min(13rem,calc(100vw-5rem))] basis-auto items-center gap-1 rounded-md px-1 py-1 hover:text-foreground">
                <span className="min-w-0 flex-1 truncate sm:max-w-32">
                  {selectedModelId ? availableModels.find((model) => model.id === selectedModelId)?.display_name || "Model" : "Default"}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || !connected || isStreaming}
              className="w-7 h-7 grid place-items-center bg-foreground text-background rounded-md hover:bg-foreground/85 disabled:opacity-25 transition-colors"
            >
              {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
          {contextMenuOpen && (
            <div className="absolute bottom-10 left-2 z-20 w-[min(13rem,calc(100vw-2rem))] rounded-lg border border-border bg-muted p-1.5 shadow-2xl">
              <button type="button" onClick={() => { onOpenFolder?.(); setContextMenuOpen(false); }} className="w-full px-2.5 py-2 flex items-center gap-2 rounded-md text-left text-xs text-foreground/70 hover:bg-accent hover:text-foreground">
                <FolderOpen className="w-4 h-4 text-blue-400" /> Open project folder
              </button>
              <button type="button" onClick={() => { onAddFiles?.(); setContextMenuOpen(false); }} className="w-full px-2.5 py-2 flex items-center gap-2 rounded-md text-left text-xs text-foreground/70 hover:bg-accent hover:text-foreground">
                <FilePlus2 className="w-4 h-4 text-emerald-400" /> Add files
              </button>
              <div className="my-1 border-t border-border" />
              <button type="button" onClick={() => { onNewProject?.(); setContextMenuOpen(false); }} className="w-full px-2.5 py-2 flex items-center gap-2 rounded-md text-left text-xs text-foreground/70 hover:bg-accent hover:text-foreground">
                <Sparkles className="w-4 h-4 text-violet-400" /> Start from scratch
              </button>
            </div>
          )}
          {modelOpen && (
            <div className="absolute bottom-10 left-2 z-20 max-h-72 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-muted p-1.5 shadow-2xl sm:left-10">
              <button
                type="button"
                onClick={() => { setSelectedModelId(null); setModelOpen(false); }}
                className={`w-full rounded-md px-2.5 py-2 text-left text-xs hover:bg-accent ${selectedModelId === null ? "bg-accent" : ""}`}
              >
                <div className="font-medium text-foreground">Default</div>
                <div className="text-[10px] text-muted-foreground">Active model from admin</div>
              </button>
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => { setSelectedModelId(model.id); setModelOpen(false); }}
                  className={`w-full rounded-md px-2.5 py-2 text-left text-xs hover:bg-accent ${selectedModelId === model.id ? "bg-accent" : ""}`}
                >
                  <div className="font-medium text-foreground">{model.display_name || model.model_id}</div>
                  <div className="text-[10px] text-muted-foreground">{model.provider_label}</div>
                </button>
              ))}
              {availableModels.length === 0 && (
                <div className="px-2.5 py-2 text-xs text-muted-foreground">No active models found</div>
              )}
            </div>
          )}
        </form>
        <p className="mt-2 text-center text-[10px] text-foreground/20">SEA can make mistakes. Review generated changes.</p>
        </div>
      </div>
    </div>
  );
}
