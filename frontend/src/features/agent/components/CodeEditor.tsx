"use client";

import { X, FileText } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus /* TODO: Light mode theme support */ } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface OpenFile {
  path: string;
  content: string;
  language: string;
}

interface CodeEditorProps {
  openFiles: OpenFile[];
  activeFile: string | null;
  onTabSelect: (path: string) => void;
  onTabClose: (path: string) => void;
}

export function CodeEditor({ openFiles, activeFile, onTabSelect, onTabClose }: CodeEditorProps) {
  if (openFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-muted-foreground gap-3">
        <FileText className="w-12 h-12 opacity-20" />
        <p className="text-sm">Select a file to view</p>
      </div>
    );
  }

  const activeFileContent = openFiles.find((f) => f.path === activeFile);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tabs */}
      <div className="flex bg-card overflow-x-auto custom-scrollbar shrink-0">
        {openFiles.map((file) => {
          const isActive = file.path === activeFile;
          const fileName = file.path.split("/").pop() || file.path;
          return (
            <div
              key={file.path}
              className={`flex items-center gap-2 px-3 py-2 min-w-max cursor-pointer border-t-2 text-sm font-mono select-none ${
                isActive
                  ? "bg-background border-blue-500 text-foreground"
                  : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => onTabSelect(file.path)}
            >
              <span>{fileName}</span>
              <button
                className={`p-0.5 rounded-md opacity-50 hover:opacity-100 hover:bg-accent ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(file.path);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto bg-background custom-scrollbar">
        {activeFileContent && (
          <SyntaxHighlighter
            language={activeFileContent.language}
            style={vscDarkPlus /* TODO: Light mode theme support */}
            customStyle={{
              margin: 0,
              background: "transparent",
              fontSize: "13px",
              lineHeight: "1.5",
              padding: "16px 0",
            }}
            showLineNumbers
            lineNumberStyle={{
              minWidth: "3em",
              paddingRight: "1em",
              color: "#858585",
              textAlign: "right",
            }}
          >
            {activeFileContent.content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
