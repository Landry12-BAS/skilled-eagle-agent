"use client";

import { useState } from "react";
import { Search, ChevronRight, ChevronDown, FileText, FileCode2, Settings, File, FolderOpen, Folder } from "lucide-react";

interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
}

interface FileExplorerProps {
  files: WorkspaceFile[];
  onFileSelect: (path: string) => void;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
}

function buildFileTree(files: WorkspaceFile[]): FileNode[] {
  const root: FileNode[] = [];
  const nodeMap = new Map<string, FileNode>();

  for (const file of files) {
    const parts = file.path.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;

      if (!nodeMap.has(currentPath)) {
        const node: FileNode = {
          name: part,
          type: isFile ? "file" : "folder",
          path: currentPath,
          children: isFile ? undefined : [],
        };
        nodeMap.set(currentPath, node);
        currentLevel.push(node);
      }

      if (!isFile) {
        const folderNode = nodeMap.get(currentPath)!;
        currentLevel = folderNode.children!;
      }
    }
  }

  return root;
}

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
  if (name.endsWith(".py")) {
    return <FileCode2 className="w-3.5 h-3.5 text-green-400" />;
  }
  if (name.endsWith(".md")) {
    return <FileText className="w-3.5 h-3.5 text-gray-400" />;
  }
  return <File className="w-3.5 h-3.5 text-muted-foreground" />;
}

export function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileTree = buildFileTree(files);

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

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    if (
      searchTerm &&
      node.type === "file" &&
      !node.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !node.path.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return null;
    }

    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const paddingLeft = `${depth * 12 + 8}px`;

    if (node.type === "folder") {
      const childrenNodes = node.children?.map((child) => renderNode(child, depth + 1)).filter(Boolean);
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
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
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

  if (files.length === 0) {
    return (
      <div className="flex flex-col h-full bg-card items-center justify-center p-4 text-center">
        <FolderOpen className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-xs text-muted-foreground">No files loaded.</p>
        <p className="text-xs text-muted-foreground mt-1">Open a folder or add files to get started.</p>
      </div>
    );
  }

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
        {fileTree.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
