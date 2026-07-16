"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Loader2, Bot, User, AlertCircle, LogIn, CheckCircle2, ChevronRight, Mic, MicOff, FileText, Plus, Square, ChevronDown, Zap, Mail, MessageSquare, SlidersHorizontal, Pencil, Copy, Image as ImageIcon, ThumbsUp, ThumbsDown, RefreshCw, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getConversationDetail, uploadDocument, getActiveModels, getCurrentUser } from "@/lib/api-client";
import { useChatSettings } from "./ChatSettingsProvider";
import Cookies from "js-cookie";
import { RichMarkdown } from "@/components/chat/RichMarkdown";
import { useAuth } from "@/hooks/useAuth";
import { DocumentLibrary } from "./DocumentLibrary";
import { ScrapeUrlModal } from "./ScrapeUrlModal";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  // For document upload bubbles
  documentName?: string;
  documentPreview?: string;
}

interface Props {
  conversationId: number | null;
  onConversationCreated?: (id: number) => void;
  focusComposerSignal?: number;
}

const languageMap: Record<string, string> = {
  german: "de-DE",
  deutsch: "de-DE",
  spanish: "es-ES",
  espanol: "es-ES",
  español: "es-ES",
  french: "fr-FR",
  francais: "fr-FR",
  français: "fr-FR",
  italian: "it-IT",
  italiano: "it-IT",
  english: "en-US",
  japanese: "ja-JP",
  chinese: "zh-CN",
  russian: "ru-RU",
  portuguese: "pt-BR",
  português: "pt-BR",
  dutch: "nl-NL",
  nederlands: "nl-NL",
  korean: "ko-KR",
  arabic: "ar-SA",
};

const getLocaleCode = (lang: string) => {
  const normalized = lang.trim().toLowerCase();
  if (languageMap[normalized]) {
    return languageMap[normalized];
  }
  if (/^[a-z]{2}-[a-z]{2}$/i.test(normalized)) {
    return lang.trim();
  }
  return "en-US";
};

export function ChatInterface({ conversationId, onConversationCreated, focusComposerSignal = 0 }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [feedbackState, setFeedbackState] = useState<Record<number, 'up' | 'down' | null>>({});
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    if (user) {
      setUserName(user.first_name || user.username || user.email?.split('@')[0] || "");
    } else {
      setUserName("");
    }
  }, [user]);


  const wsRef = useRef<WebSocket | null>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const activeConversationIdRef = useRef<number | null>(conversationId);
  const prevConversationIdRef = useRef<number | null>(conversationId);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusComposerSignal > 0) textareaRef.current?.focus();
  }, [focusComposerSignal]);

  const streamingContentRef = useRef("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [systemStatus, setSystemStatus] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  // Pending documents: set after upload or from library, consumed on the next manual Send
  const [pendingDocs, setPendingDocs] = useState<Array<{ id?: string; name: string; content: string; file_type?: string }>>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Toolbar state
  type Effort = "low" | "medium" | "high" | "max";
  const [effort, setEffort] = useState<Effort>("medium");
  const [effortOpen, setEffortOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<Array<{ id: number; model_id: string; display_name: string; provider: string; provider_label: string }>>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const EFFORT_CONFIG: Record<Effort, { label: string; color: string; desc: string }> = {
    low:    { label: "Low",    color: "text-blue-400",   desc: "Fast, concise" },
    medium: { label: "Medium", color: "text-green-400",  desc: "Balanced" },
    high:   { label: "High",   color: "text-yellow-400", desc: "Detailed" },
    max:    { label: "Max",    color: "text-red-400",    desc: "Most thorough" },
  };

  const { settings } = useChatSettings();

  const scrollToBottom = (force = false) => {
    const container = historyScrollRef.current;
    if (!container || (!force && !shouldStickToBottomRef.current)) return;
    container.scrollTop = container.scrollHeight;
  };

  const handleHistoryScroll = () => {
    const container = historyScrollRef.current;
    if (!container) return;
    shouldStickToBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 64;
  };

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load available AI models for the selector
  useEffect(() => {
    const token = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
    if (!token) return;
    getActiveModels(token)
      .then((data) => setAvailableModels(data.models))
      .catch(() => {}); // silently fail
  }, []);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Load history when conversationId changes
  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    prevConversationIdRef.current = conversationId;
    shouldStickToBottomRef.current = true;

    // If we transition from a new/null conversation ID, but we already have messages loaded in memory,
    // we don't clear the messages or refetch. We just update active ID to avoid loading flicker.
    const isTransitionFromNull = (prevId === null || prevId === 0);
    if (isTransitionFromNull && conversationId && messagesRef.current.length > 0) {
      activeConversationIdRef.current = conversationId;
      return;
    }

    activeConversationIdRef.current = conversationId;
    setMessages([]);
    setStreamingContent("");
    streamingContentRef.current = "";
    setIsStreaming(false);
    setIsTyping(false);
    setError(null);
    setEditingMessageId(null);
    setEditingMessageIndex(null);
    setEditingMessageText("");

    if (!conversationId) return;

    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) return;

    setLoadingHistory(true);
    getConversationDetail(conversationId, token)
      .then((data) => {
        const msgs = (data.messages || []).map((m: { id: number; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages(msgs);
      })
      .catch(() => setError("Failed to load conversation history."))
      .finally(() => setLoadingHistory(false));
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Initialize WebSocket once
  useEffect(() => {
    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) {
      setError("Not authenticated. Please log in.");
      return;
    }

    const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "");
    const wsUrl = `${baseUrl}/ws/chat/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setError(null);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "status") {
        setSystemStatus(data.content);
      } else if (data.type === "token") {
        setSystemStatus(null);
        streamingContentRef.current += data.content;
        setStreamingContent(streamingContentRef.current);
      } else if (data.type === "done") {
        const finalContent = streamingContentRef.current;
        // Add message to list BEFORE clearing the streaming bubble
        // so React batches both state updates together — no blank frame.
        if (finalContent) {
          setMessages((msgs) => [...msgs, { role: "assistant", content: finalContent }]);
        }
        streamingContentRef.current = "";
        setStreamingContent("");
        setIsStreaming(false);
        setIsTyping(false);
        setSystemStatus(null);
        // If server created a new conversation, notify parent
        if (data.conversation_id && !activeConversationIdRef.current) {
          activeConversationIdRef.current = data.conversation_id;
          onConversationCreated?.(data.conversation_id);
        }
        window.dispatchEvent(new Event("conversationUpdated"));

        // Sync messages from server to get database IDs for editing
        if (data.conversation_id || activeConversationIdRef.current) {
          const cid = data.conversation_id || activeConversationIdRef.current;
          getConversationDetail(cid, token)
            .then((detail) => {
              const msgs = (detail.messages || []).map((m: { id: number; role: string; content: string }) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
              }));
              setMessages(msgs);
            })
            .catch(() => {});
        }
      } else if (data.type === "error") {
        const partialContent = streamingContentRef.current;
        streamingContentRef.current = "";
        setStreamingContent("");
        setIsStreaming(false);
        setIsTyping(false);
        setSystemStatus(null);
        if (partialContent) {
          setMessages((msgs) => [...msgs, { role: "assistant", content: partialContent }]);
        }
        setError(data.content);
      }
    };

    ws.onerror = () => {
      setError("WebSocket error. Is the backend running?");
      setIsTyping(false);
      setIsStreaming(false);
    };

    ws.onclose = (event) => {
      if (event.code === 4001) setError("Unauthorized connection.");
    };

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const handleStop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
    }
    setIsTyping(false);
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = input.trim().length > 0;
    if ((!hasText && pendingDocs.length === 0) || isTyping) return;

    const newMsgs: Message[] = [];

    pendingDocs.forEach(doc => {
      const previewLines = doc.content?.split("\n").filter(Boolean).slice(0, 3).join(" ").slice(0, 120) || "";
      newMsgs.push({
        role: "user",
        content: `[Document: ${doc.name}]`,
        documentName: doc.name,
        documentPreview: previewLines,
      });
    });

    if (hasText) {
      newMsgs.push({ role: "user", content: input.trim() });
    }

    shouldStickToBottomRef.current = true;
    const newMessages = [...messages, ...newMsgs];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);
    setIsStreaming(true);
    streamingContentRef.current = "";
    setStreamingContent("");
    setError(null);

    const systemInstruction = `${settings.systemPrompt}\n\n${settings.userIdentity ? `You are interacting with: ${settings.userIdentity}\n` : ""}Language: ${settings.language}\nLength constraint: ${settings.responseLength}\nCurrent local time: ${new Date().toLocaleString()}`;

    const extraSystemMessages = pendingDocs.map(doc => ({
      role: "system" as const,
      content: `The user has attached a document named "${doc.name}". Here is its full content:\n\n---\n${doc.content}\n---\n\nAnswer the user's questions based on this document.`,
    }));

    const messagesWithSystem = [
      { role: "system" as const, content: systemInstruction },
      ...extraSystemMessages,
      ...newMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    if (pendingDocs.length > 0) setPendingDocs([]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        messages: messagesWithSystem,
        conversation_id: activeConversationIdRef.current || null,
        effort,
        model_id: selectedModelId,
        document_ids: pendingDocs.map(d => d.id).filter(Boolean),
      }));
      window.dispatchEvent(new Event("conversationUpdated"));
    } else {
      setError("WebSocket is not connected. Please refresh the page.");
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || !conversationId) return;
    const lastUserMsgIndex = messages.map(m => m.role).lastIndexOf("user");
    if (lastUserMsgIndex === -1) return;

    const lastAssistantMsgIndex = messages.map(m => m.role).lastIndexOf("assistant");
    if (lastAssistantMsgIndex === -1) return;
    const assistantMsg = messages[lastAssistantMsgIndex];

    if (assistantMsg.id) {
      try {
        const token = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
        const { truncateMessages } = await import("@/lib/api-client");
        await truncateMessages(assistantMsg.id, token);
        
        // Re-submit everything up to the user message
        shouldStickToBottomRef.current = true;
        const newMessages = messages.slice(0, lastAssistantMsgIndex);
        setMessages(newMessages);
        
        const systemInstruction = `${settings.systemPrompt}\n\n${settings.userIdentity ? `You are interacting with: ${settings.userIdentity}\n` : ""}Language: ${settings.language}\nLength constraint: ${settings.responseLength}\nCurrent local time: ${new Date().toLocaleString()}`;
        const messagesWithSystem = [
          { role: "system" as const, content: systemInstruction },
          ...newMessages.map((m) => ({ role: m.role, content: m.content })),
        ];

        wsRef.current?.send(JSON.stringify({
          conversation_id: activeConversationIdRef.current,
          messages: messagesWithSystem,
          model_id: selectedModelId,
          effort,
        }));
        setIsTyping(true);
        setIsStreaming(true);
      } catch (err) {
        setToastMessage({ text: "Failed to regenerate", type: "error" });
      }
    }
  };

  const handleEdit = (msg: Message, index: number) => {
    if (isTyping || msg.role !== "user" || msg.documentName) return;
    if (!msg.id) {
      setToastMessage({ text: "This message is still syncing. Try editing again in a moment.", type: "error" });
      return;
    }
    setEditingMessageId(msg.id);
    setEditingMessageIndex(index);
    setEditingMessageText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageIndex(null);
    setEditingMessageText("");
  };

  const handleSubmitEdit = async () => {
    if (!conversationId || editingMessageId === null || editingMessageIndex === null) return;
    const editedText = editingMessageText.trim();
    if (!editedText || isTyping) return;

    try {
      const token = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
      const { truncateMessages } = await import("@/lib/api-client");
      await truncateMessages(editingMessageId, token);

      shouldStickToBottomRef.current = true;
      const baseMessages = messages.slice(0, editingMessageIndex);
      const rebuiltMessages: Message[] = [...baseMessages, { role: "user", content: editedText }];

      setMessages(rebuiltMessages);
      setIsTyping(true);
      setIsStreaming(true);
      setSystemStatus(null);
      streamingContentRef.current = "";
      setStreamingContent("");
      setError(null);
      handleCancelEdit();

      const systemInstruction = `${settings.systemPrompt}\n\n${settings.userIdentity ? `You are interacting with: ${settings.userIdentity}\n` : ""}Language: ${settings.language}\nLength constraint: ${settings.responseLength}\nCurrent local time: ${new Date().toLocaleString()}`;
      const messagesWithSystem = [
        { role: "system" as const, content: systemInstruction },
        ...rebuiltMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          conversation_id: activeConversationIdRef.current,
          messages: messagesWithSystem,
          model_id: selectedModelId,
          effort,
        }));
        window.dispatchEvent(new Event("conversationUpdated"));
      } else {
        setError("WebSocket is not connected. Please refresh the page.");
        setIsTyping(false);
        setIsStreaming(false);
      }
    } catch {
      setToastMessage({ text: "Failed to edit message", type: "error" });
    }
  };

  const handleCopyMessage = async (content: string) => {
    if (!content?.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      setToastMessage({ text: "Copied to clipboard", type: "success" });
    } catch {
      setToastMessage({ text: "Failed to copy", type: "error" });
    }
  };

  const handleShareMessage = async (content: string) => {
    if (!content?.trim()) return;
    try {
      if (navigator.share) {
        await navigator.share({ text: content });
      } else {
        await navigator.clipboard.writeText(content);
        setToastMessage({ text: "Copied to clipboard", type: "success" });
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        setToastMessage({ text: "Failed to share", type: "error" });
      }
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const useFallbackRef = useRef(false);

  const transcribeViaServer = async (audioBlob: Blob) => {
    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) {
      setToastMessage({ text: "You must be logged in to use voice input.", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    const mappedLang = getLocaleCode(settings.language);
    formData.append("language", mappedLang.split("-")[0]);

    try {
      const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
      const resp = await fetch(`${API}/ai/transcribe/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${resp.status}`);
      }
      const data = await resp.json();
      if (data.text) {
        setInput((prev) => prev ? `${prev} ${data.text}` : data.text);
      }
    } catch (e: any) {
      setToastMessage({ text: `Transcription failed: ${e.message}`, type: "error" });
    }
  };

  const startFallbackRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setToastMessage({ text: "Transcribing audio...", type: "success" });
          await transcribeViaServer(audioBlob);
          setToastMessage(null);
        }
      };

      mediaRecorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        setToastMessage({ text: "Recording failed.", type: "error" });
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (e: any) {
      setIsListening(false);
      if (e.name === "NotAllowedError") {
        setToastMessage({ text: "Microphone access denied. Please allow microphone permissions in your browser.", type: "error" });
      } else {
        setToastMessage({ text: `Microphone error: ${e.message}`, type: "error" });
      }
    }
  };

  const toggleSpeechRecognition = () => {
    // Stop recording / listening
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        return;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // If we already know the Web Speech API fails in this browser, go straight to fallback
    if (useFallbackRef.current) {
      startFallbackRecording();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // No Web Speech API at all — use fallback
      useFallbackRef.current = true;
      startFallbackRecording();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const mappedLang = getLocaleCode(settings.language);
      recognition.lang = mappedLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        
        if (event.error === 'network') {
          // Brave / ad-blocker blocks Google speech service — switch to fallback permanently
          useFallbackRef.current = true;
          setToastMessage({ text: "Switching to server-side transcription...", type: "success" });
          startFallbackRecording();
          return;
        } else if (event.error === 'not-allowed') {
          setToastMessage({ text: "Microphone access denied. Please allow microphone permissions in your browser.", type: "error" });
        } else {
          setToastMessage({ text: `Speech recognition error: ${event.error}`, type: "error" });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      // If it throws, also try fallback
      useFallbackRef.current = true;
      startFallbackRecording();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) {
      setToastMessage({ text: "You must be logged in to upload files.", type: "error" });
      return;
    }

    setIsUploading(true);
    setToastMessage(null);

    try {
      const uploadedDocs = await Promise.all(files.map(async (file) => {
        const result = await uploadDocument(file, token);
        return {
          id: result.id,
          name: result.filename || file.name,
          content: result.content || result.extracted_text || "",
          file_type: result.file_type || (file.type.startsWith("image/") ? "image" : "text"),
        };
      }));
      setPendingDocs(prev => [...prev, ...uploadedDocs]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      setToastMessage({ text: msg, type: "error" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
    }
  };

  const exportMarkdown = () => {
    let md = `# Conversation Export\n\n`;
    messages.forEach((m) => {
      md += `**${m.role === "user" ? userName || "User" : settings.aiName}**:\n${m.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_export_${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #333;">
        <h2 style="text-align:center; color: #111;">Conversation Export</h2>
        <hr style="margin-bottom: 20px;" />
        ${messages.map(m => `
          <div style="margin-bottom: 15px;">
            <strong style="color: ${m.role === 'user' ? '#2563eb' : '#9333ea'};">${m.role === "user" ? userName || "User" : settings.aiName}</strong>
            <div style="margin-top: 5px; white-space: pre-wrap; font-size: 14px;">${m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>
        `).join('')}
      </div>
    `;
    const opt = {
      margin: 10,
      filename: `chat_export_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
      {/* Chat Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-background/20 p-3.5 shadow-sm backdrop-blur-xl sm:p-4">
        <div>
          <h2 className="font-semibold">{settings.aiName}</h2>
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
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center text-destructive text-sm gap-2 mr-2">
              <AlertCircle className="w-4 h-4" />
              <span className="max-w-xs truncate">{error}</span>
            </div>
          )}
          {messages.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={exportMarkdown} className="h-8 text-xs border-white/10 hover:bg-white/5">
                Markdown
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF} className="h-8 text-xs border-white/10 hover:bg-white/5">
                PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Chat History */}
      <div ref={historyScrollRef} onScroll={handleHistoryScroll} className="flex-1 overflow-y-auto space-y-3 p-2 sm:p-3">
        {loadingHistory && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-black/30" />
          </div>
        )}

        {!loadingHistory && messages.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center">
            {error && error.includes("authentic") ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-2xl border text-center max-w-sm">
                  <AlertCircle className="w-10 h-10 text-destructive mb-2 opacity-100" />
                  <h3 className="text-lg font-medium text-foreground opacity-100">Authentication Required</h3>
                  <p className="text-sm">You need to log in to access the AI Chat interface.</p>
                  <Link href="/login" className="mt-2 w-full">
                    <Button className="w-full gap-2 opacity-100">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-3 sm:-mt-6">
                <div className="mb-4 w-full space-y-1.5 text-left sm:mb-6">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    Hi there, <span className={`bg-gradient-to-r ${settings.aiColor} bg-clip-text text-transparent`}>{userName || 'Guest'}</span>
                  </h1>
                  <h2 className={`bg-gradient-to-r text-lg font-semibold tracking-tight text-transparent opacity-70 sm:text-2xl md:text-3xl ${settings.aiColor} bg-clip-text`}>
                    What would you like to know?
                  </h2>
                  <p className="text-muted-foreground text-sm pt-2 max-w-xl">
                    Use one of the most common prompts below or use your own to begin
                  </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { text: "Write a to-do list for a personal project or task", icon: <User className="w-5 h-5" /> },
                    { text: "Generate an email to reply to a job offer", icon: <Mail className="w-5 h-5" /> },
                    { text: "Summarize this article or text for me in one paragraph", icon: <MessageSquare className="w-5 h-5" /> },
                    { text: "How does AI work in a technical capacity", icon: <SlidersHorizontal className="w-5 h-5" /> },
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setInput(prompt.text); }}
                      className="group flex h-28 flex-col items-start justify-between rounded-xl border border-border/60 bg-card/40 p-3 text-left text-foreground shadow-sm transition-all duration-200 hover:border-border hover:bg-card hover:shadow-md sm:p-3.5"
                    >
                      <span className="line-clamp-3 text-xs font-medium leading-5">{prompt.text}</span>
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                        <div className="scale-90 origin-left">{prompt.icon}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl space-y-4 pb-6 sm:space-y-5 sm:pb-8">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={msg.role === "user" ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`group flex items-start gap-2 sm:gap-4 ${msg.role === "assistant" ? "flex-row justify-start" : "flex-row justify-end"}`}
              >
                {msg.role === "assistant" && (
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white mt-0.5 bg-gradient-to-br ${settings.aiColor} shadow-sm`}>
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className={`flex min-w-0 flex-col ${msg.role === "assistant" ? "w-full" : "max-w-[88%] sm:max-w-[75%]"}`}>
                  <div className={`${msg.role === "assistant" ? "text-foreground" : "text-foreground/90 whitespace-pre-wrap bg-white/10 px-5 py-3 rounded-3xl"}`}>
                {msg.role === "user" ? (
                  editingMessageId === msg.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                        rows={3}
                        className="w-full min-w-0 bg-white/15 border border-white/30 rounded-lg p-2.5 text-sm text-white placeholder:text-white/70 resize-y focus:outline-none focus:ring-2 focus:ring-white/40"
                        placeholder="Edit your message..."
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-xs px-2.5 py-1 rounded-md bg-black/20 hover:bg-black/30 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitEdit}
                          disabled={!editingMessageText.trim() || isTyping}
                          className="text-xs px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                        >
                          Save & regenerate
                        </button>
                      </div>
                    </div>
                  ) : msg.documentName ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="w-5 h-5 opacity-90 shrink-0" />
                        <span className="truncate max-w-[220px]">{msg.documentName}</span>
                      </div>
                      {msg.documentPreview && (
                        <p className="text-xs opacity-70 line-clamp-2 leading-relaxed border-t border-white/20 pt-1.5 mt-0.5">
                          {msg.documentPreview}…
                        </p>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )
                ) : (
                  <RichMarkdown content={msg.content} />
                )}
                  </div>
                  
                  {/* Actions overlay */}
                  {!isTyping && (
                    <div className={`mt-2 flex items-center gap-1 opacity-75 transition-opacity hover:opacity-100 ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      {msg.role === "assistant" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.content)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                            title="Copy message"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {msg.id && idx === messages.length - 1 && (
                            <button 
                              type="button" 
                              onClick={handleRegenerate} 
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                              title="Regenerate response"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFeedbackState(prev => ({ ...prev, [idx]: prev[idx] === 'up' ? null : 'up' }))}
                            className={`rounded-lg p-2 transition-colors hover:bg-white/5 ${feedbackState[idx] === 'up' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedbackState(prev => ({ ...prev, [idx]: prev[idx] === 'down' ? null : 'down' }))}
                            className={`rounded-lg p-2 transition-colors hover:bg-white/5 ${feedbackState[idx] === 'down' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Bad response"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareMessage(msg.content)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                            title="Share"
                          >
                            <Share className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          {!msg.documentName && (
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.content)}
                              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          )}
                          {!msg.documentName && (
                            <button type="button" onClick={() => handleEdit(msg, idx)} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
          ))}
        </AnimatePresence>

          {/* System Status Indicator (e.g. Searching Web) */}
          {systemStatus && (
            <div className="flex flex-row items-start gap-2 sm:gap-4">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-br ${settings.aiColor} shadow-sm mt-0.5`}>
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-3 w-full rounded-lg px-4 py-3 bg-primary/10 border border-primary/20 text-primary shadow-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">{systemStatus}</span>
              </div>
            </div>
          )}

          {/* Live streaming bubble — no animation to prevent flicker */}
          {isStreaming && (
            <div className="flex flex-row items-start gap-2 sm:gap-4">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-br ${settings.aiColor} shadow-sm mt-0.5`}>
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col w-full min-w-0 text-foreground pt-0.5">
              {streamingContent ? (
                <RichMarkdown content={streamingContent} />
              ) : (
                <div className="flex gap-1 items-center h-6">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-current" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-2 h-2 rounded-full bg-current" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-2 h-2 rounded-full bg-current" />
                </div>
              )}
              </div>
            </div>
          )}
        </div>
        
      </div>

      <div className="relative flex shrink-0 justify-center bg-gradient-to-t from-background/80 to-transparent p-2 pb-3 sm:p-4 sm:pb-6">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg border flex items-center gap-2 z-50 backdrop-blur-md ${
                toastMessage.type === "success" 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-3xl">
          {/* ── Single unified input bar ─────────────────────────────── */}
          <form
            onSubmit={handleSend}
            onClick={() => { setPlusOpen(false); setEffortOpen(false); setModelOpen(false); }}
            className="min-w-0 w-full bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-visible"
          >
            {/* Hidden file inputs */}
            <input type="file" ref={fileInputRef} className="hidden" multiple accept=".txt,.md,.pdf,.docx,image/*" onChange={handleFileUpload} />
            <input type="file" ref={folderInputRef} className="hidden" multiple {...{ webkitdirectory: "true", directory: "true" } as any} onChange={handleFileUpload} />

            {/* Attachment chip row */}
            {pendingDocs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mx-3 mt-2.5">
                {pendingDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg w-fit max-w-[260px]">
                    {doc.file_type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" /> : <FileText className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className="truncate text-foreground font-medium text-xs">{doc.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDocs(docs => docs.filter((_, index) => index !== i));
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded shrink-0"
                    >
                      <span className="text-xs leading-none">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main text input row */}
            <div className="flex items-end gap-1.5 px-2 py-2 sm:gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the AI anything..."
                rows={1}
                className="min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-0 sm:px-3 sm:text-sm"
              />
              {/* Voice */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleSpeechRecognition(); }}
                disabled={isUploading || isTyping}
                className={`flex items-center justify-center w-10 h-10 mb-0.5 rounded-full transition-all shrink-0 ${
                  isListening
                    ? "bg-red-500/10 text-red-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                } disabled:opacity-40`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              {/* Stop / Send */}
              {isTyping ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); handleStop(); }}
                  className="rounded-full w-10 h-10 mb-0.5 shrink-0 bg-destructive/90 hover:bg-destructive text-white shadow-lg"
                  title="Stop generating"
                >
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={(!input.trim() && pendingDocs.length === 0) || isTyping || isUploading}
                  className={`rounded-full w-10 h-10 mb-0.5 shrink-0 transition-all duration-300 shadow-lg ${
                    (input.trim() || pendingDocs.length > 0)
                      ? `bg-gradient-to-r ${settings.aiColor} hover:opacity-90 text-white scale-100`
                      : "bg-white/5 text-muted-foreground scale-95"
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
              )}
            </div>

            {/* Bottom toolbar row */}
            <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5 pt-0.5">

              {/* + button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPlusOpen(o => !o); setEffortOpen(false); setModelOpen(false); }}
                  disabled={isUploading || isTyping}
                  className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-muted-foreground hover:text-foreground hover:border-white/30 transition-all disabled:opacity-40"
                  title="Attach"
                >
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                </button>
                <AnimatePresence>
                  {plusOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-8 left-0 z-50 w-[min(13rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl"
                    >
                      <button type="button" onClick={() => { fileInputRef.current?.click(); setPlusOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-white/10 transition-colors text-left">
                        <FileText className="w-4 h-4 text-primary shrink-0" /> Upload file
                      </button>
                      <button type="button" onClick={() => { folderInputRef.current?.click(); setPlusOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-white/10 transition-colors text-left border-t border-white/5">
                        <Plus className="w-4 h-4 text-primary shrink-0" /> Upload folder
                      </button>
                      <button type="button" onClick={() => { setScrapeModalOpen(true); setPlusOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-white/10 transition-colors text-left border-t border-white/5">
                        <Plus className="w-4 h-4 text-primary shrink-0" /> Scrape URL
                      </button>
                      <button type="button" onClick={() => { setLibraryModalOpen(true); setPlusOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-white/10 transition-colors text-left border-t border-white/5">
                        <FileText className="w-4 h-4 text-primary shrink-0" /> Document Library
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Effort selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEffortOpen(o => !o); setPlusOpen(false); setModelOpen(false); }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 text-xs font-medium hover:border-white/25 transition-all ${EFFORT_CONFIG[effort].color}`}
                >
                  <Zap className="w-3 h-3" />
                  {EFFORT_CONFIG[effort].label}
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {effortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-8 left-0 z-50 w-[min(14rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl"
                    >
                      {(["low", "medium", "high", "max"] as Effort[]).map((e) => (
                        <button key={e} type="button"
                          onClick={() => { setEffort(e); setEffortOpen(false); }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-white/10 transition-colors text-left ${effort === e ? "bg-white/5" : ""}`}>
                          <div className="flex items-center gap-2">
                            <Zap className={`w-3.5 h-3.5 ${EFFORT_CONFIG[e].color}`} />
                            <span className={EFFORT_CONFIG[e].color}>{EFFORT_CONFIG[e].label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{EFFORT_CONFIG[e].desc}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Model selector */}
              {availableModels.length > 0 && (
                <div className="relative min-w-0 max-w-[min(13rem,calc(100vw-5rem))] basis-auto">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setModelOpen(o => !o); setPlusOpen(false); setEffortOpen(false); }}
                    className="flex w-auto max-w-full min-w-0 items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-xs text-muted-foreground transition-all hover:border-white/25 hover:text-foreground sm:max-w-[150px]"
                  >
                    <Bot className="w-3 h-3 shrink-0" />
                    <span className="truncate">{selectedModelId ? availableModels.find(m => m.id === selectedModelId)?.display_name ?? "Model" : "Default"}</span>
                    <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                  </button>
                  <AnimatePresence>
                    {modelOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-9 left-0 z-50 max-h-[min(18rem,45dvh)] w-[min(17rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl"
                      >
                        <button type="button" onClick={() => { setSelectedModelId(null); setModelOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-white/10 transition-colors text-left ${!selectedModelId ? "bg-white/5" : ""}`}>
                          <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div><div className="font-medium">Default</div><div className="text-xs text-muted-foreground">Active in Admin</div></div>
                        </button>
                        {availableModels.map((m) => (
                          <button key={m.id} type="button"
                            onClick={() => { setSelectedModelId(m.id); setModelOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-white/10 transition-colors text-left border-t border-white/5 ${selectedModelId === m.id ? "bg-white/5" : ""}`}>
                            <Bot className="w-4 h-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{m.display_name}</div>
                              <div className="text-xs text-muted-foreground">{m.provider_label}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <DocumentLibrary
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onAttach={(docs) => setPendingDocs((prev) => [...prev, ...docs])}
      />
      
      <ScrapeUrlModal
        isOpen={scrapeModalOpen}
        onClose={() => setScrapeModalOpen(false)}
        onAttach={(doc) => setPendingDocs((prev) => [...prev, doc])}
      />
    </div>
  );
}
