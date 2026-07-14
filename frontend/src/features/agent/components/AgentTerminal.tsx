"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, Trash2 } from "lucide-react";
import Cookies from "js-cookie";

export interface TerminalLine {
  type: "command" | "output" | "error" | "info";
  content: string;
}

interface AgentTerminalProps {
  lines: TerminalLine[];
}

const DEFAULT_LINES: TerminalLine[] = [
  { type: "info", content: "Skilled Eagle Agent initialized" },
  { type: "info", content: "Ready to assist with your codebase" },
];

export function AgentTerminal({ lines }: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayLines, setDisplayLines] = useState<TerminalLine[]>(lines.length > 0 ? lines : DEFAULT_LINES);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (lines.length > 0) {
      setDisplayLines(lines);
    }
  }, [lines]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayLines]);

  useEffect(() => {
    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) return;

    const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "");
    const socket = new WebSocket(`${baseUrl}/ws/sea/?token=${encodeURIComponent(token)}`);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "tool_start") {
          const name = data.tool;
          let content = `executing tool ${name}...`;
          if (name === "run_shell" && data.arguments?.command) {
            content = data.arguments.command;
          }
          setDisplayLines((prev) => [
            ...prev,
            { type: "command", content }
          ]);
        } else if (data.type === "tool_done") {
          const name = data.tool;
          if (name !== "run_shell") {
            setDisplayLines((prev) => [
              ...prev,
              { type: "output", content: String(data.output) }
            ]);
          }
        } else if (data.type === "terminal_log") {
          const content = data.content.replace(/\r?\n$/, "");
          setDisplayLines((prev) => [
            ...prev,
            {
              type: data.stream === "stderr" ? "error" : "output",
              content
            }
          ]);
        }
      } catch (err) {
        console.error("Error parsing websocket message in terminal", err);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="flex flex-col h-full bg-background font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          <TerminalIcon className="w-3.5 h-3.5" />
          Terminal
        </div>
        <button 
          onClick={() => setDisplayLines([])}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Clear Terminal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 text-xs space-y-1 custom-scrollbar">
        {displayLines.map((line, i) => (
          <div key={i} className="flex break-all text-left">
            {line.type === "command" && (
              <span className="text-green-400 mr-2 shrink-0">$</span>
            )}
            {line.type === "info" && (
              <span className="text-cyan-400 mr-2 shrink-0">{">"}</span>
            )}
            <span className={`
              ${line.type === "command" ? "text-foreground" : ""}
              ${line.type === "output" ? "text-muted-foreground" : ""}
              ${line.type === "error" ? "text-red-400" : ""}
              ${line.type === "info" ? "text-cyan-400" : ""}
            `}>
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
