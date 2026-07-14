"use client";

import { useState } from "react";
import { Search, ChevronRight, ChevronDown, FileText, FileCode2, Settings, File } from "lucide-react";

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
}

const FILE_TREE: FileNode[] = [
  {
    name: "src",
    type: "folder",
    path: "src",
    children: [
      {
        name: "app",
        type: "folder",
        path: "src/app",
        children: [
          { name: "page.tsx", type: "file", path: "src/app/page.tsx" },
          { name: "layout.tsx", type: "file", path: "src/app/layout.tsx" },
          { name: "globals.css", type: "file", path: "src/app/globals.css" },
        ],
      },
      {
        name: "features",
        type: "folder",
        path: "src/features",
        children: [
          {
            name: "chat",
            type: "folder",
            path: "src/features/chat",
            children: [
              {
                name: "components",
                type: "folder",
                path: "src/features/chat/components",
                children: [
                  { name: "ChatInterface.tsx", type: "file", path: "src/features/chat/components/ChatInterface.tsx" },
                  { name: "ConversationSidebar.tsx", type: "file", path: "src/features/chat/components/ConversationSidebar.tsx" },
                ],
              },
            ],
          },
          {
            name: "agent",
            type: "folder",
            path: "src/features/agent",
            children: [
              {
                name: "components",
                type: "folder",
                path: "src/features/agent/components",
                children: [
                  { name: "SEAInterface.tsx", type: "file", path: "src/features/agent/components/SEAInterface.tsx" },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "components",
        type: "folder",
        path: "src/components",
        children: [
          {
            name: "ui",
            type: "folder",
            path: "src/components/ui",
            children: [
              { name: "button.tsx", type: "file", path: "src/components/ui/button.tsx" },
              { name: "input.tsx", type: "file", path: "src/components/ui/input.tsx" },
            ],
          },
        ],
      },
      {
        name: "lib",
        type: "folder",
        path: "src/lib",
        children: [
          { name: "api-client.ts", type: "file", path: "src/lib/api-client.ts" },
          { name: "utils.ts", type: "file", path: "src/lib/utils.ts" },
        ],
      },
    ],
  },
  { name: "package.json", type: "file", path: "package.json" },
  { name: "tsconfig.json", type: "file", path: "tsconfig.json" },
];

function getFileIcon(name: string) {
  if (name.endsWith(".ts") || name.endsWith(".tsx")) {
    return <FileText className="w-3.5 h-3.5 text-blue-400" />;
  }
  if (name.endsWith(".css")) {
    return <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />;
  }
  if (name.endsWith(".json")) {
    return <Settings className="w-3.5 h-3.5 text-yellow-400" />;
  }
  return <File className="w-3.5 h-3.5 text-muted-foreground" />;
}

export function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src", "src/app", "src/features", "src/features/agent", "src/features/agent/components"])
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (path: string) => {
    setSelectedFile(path);
    onFileSelect(path);
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    // Basic search filtering (simplistic)
    if (searchTerm && node.type === "file" && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const paddingLeft = `${depth * 12 + 8}px`;

    if (node.type === "folder") {
      // If we are searching, and no children match, maybe hide folder. 
      // For simplicity, we just render it. A robust search would filter out empty folders.
      const childrenNodes = node.children?.map(child => renderNode(child, depth + 1)).filter(Boolean);
      if (searchTerm && (!childrenNodes || childrenNodes.length === 0)) {
         return null;
      }

      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-1.5 py-1 text-sm cursor-pointer hover:bg-accent text-muted-foreground font-mono transition-colors"
            style={{ paddingLeft }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate select-none">{node.name}</span>
          </div>
          {isExpanded && childrenNodes}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`flex items-center gap-2 py-1 text-sm cursor-pointer font-mono transition-colors ${
          isSelected ? "bg-blue-500/20 text-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 12 + 24}px` }}
        onClick={() => handleFileClick(node.path)}
      >
        {getFileIcon(node.name)}
        <span className="truncate select-none">{node.name}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted text-foreground text-xs pl-7 pr-2 py-1.5 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {FILE_TREE.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
