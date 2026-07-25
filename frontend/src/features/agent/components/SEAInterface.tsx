"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import {
  Bot, ChevronDown, ChevronRight, Clock, Command, FilePlus2,
  Folder, FolderOpen, GitBranch, GitPullRequest, Plug, Plus,
  SquarePen, Wrench, Search, Settings, Sparkles
} from "lucide-react";
import { FileExplorer } from "./FileExplorer";
import { AgentChat } from "./AgentChat";
import { AgentTerminal } from "./AgentTerminal";
import { AGENT_PLUGINS, PLUGIN_STORAGE_KEY, PluginsView } from "./PluginsView";
import { ProjectsView, type ProjectSummary } from "./ProjectsView";
import { PullRequestsView } from "./PullRequestsView";
import { ScheduledView } from "./ScheduledView";
import { GITHUB_CONNECTION_STORAGE_KEY, type GitHubConnection, loadGitHubConnection, saveGitHubConnection } from "./githubConnection";
import { getConversations } from "@/lib/api-client";
import Cookies from "js-cookie";

interface WorkspaceFile { path: string; content: string; language: string; }
type WorkspaceView = "chat" | "projects" | "scheduled" | "plugins" | "pullRequests";

interface Conversation {
  id: number;
  title: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
  is_pinned: boolean;
  folder: string;
}

const directoryInputProps = { webkitdirectory: "", directory: "" } as InputHTMLAttributes<HTMLInputElement>;
const PROJECTS_STORAGE_KEY = "sea-projects";
const PROJECT_WORKSPACES_STORAGE_KEY = "sea-project-workspaces";
type DirectoryHandle = { name: string; getDirectoryHandle(name: string, options: { create: boolean }): Promise<DirectoryHandle>; getFileHandle(name: string, options: { create: boolean }): Promise<{ createWritable(): Promise<{ write(content: string): Promise<void>; close(): Promise<void> }> }> };
type DirectoryPickerWindow = Window & { showDirectoryPicker?: (options: { mode: "readwrite" }) => Promise<DirectoryHandle> };

const terminalLines = [
  { type: "info" as const, content: "Skilled Eagle Agent ready" },
  { type: "output" as const, content: "Ask SEA to inspect, explain, or modify your project." },
];

function languageFor(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() || "text";
  return ({ ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx", py: "python", json: "json", md: "markdown", css: "css", html: "html" } as Record<string, string>)[extension] || extension;
}

export function SEAInterface({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [currentView, setCurrentView] = useState<WorkspaceView>("chat");
  const [taskKey, setTaskKey] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [openFiles, setOpenFiles] = useState<WorkspaceFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>(["workspace", "vision"]);
  const [githubConnection, setGithubConnection] = useState<GitHubConnection | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [template, setTemplate] = useState("blank");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [sidebarSection, setSidebarSection] = useState<"files" | "history">("history");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const syncMobileLayout = () => {
      if (!media.matches) return;
      setSidebarOpen(false);
    };
    syncMobileLayout();
    media.addEventListener("change", syncMobileLayout);
    return () => media.removeEventListener("change", syncMobileLayout);
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      const token = Cookies.get("access_token") || localStorage.getItem("access_token");
      if (!token) { setConversationsLoading(false); return; }
      try {
        const data = await getConversations(token, "", "sea");
        setConversations(Array.isArray(data) ? data : (data.results || []));
      } catch { /* silently fail */ } finally { setConversationsLoading(false); }
    }
    fetchConversations();
    window.addEventListener("conversationUpdated", fetchConversations);
    return () => window.removeEventListener("conversationUpdated", fetchConversations);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setProjects(JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || "[]")); } catch { setProjects([]); }
      try { setEnabledPlugins(JSON.parse(localStorage.getItem(PLUGIN_STORAGE_KEY) || '["workspace","vision"]')); } catch { setEnabledPlugins(["workspace", "vision"]); }
      setGithubConnection(loadGitHubConnection());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleGitHubConnectionChange() { setGithubConnection(loadGitHubConnection()); }
    window.addEventListener(GITHUB_CONNECTION_STORAGE_KEY, handleGitHubConnectionChange);
    window.addEventListener("storage", handleGitHubConnectionChange);
    return () => {
      window.removeEventListener(GITHUB_CONNECTION_STORAGE_KEY, handleGitHubConnectionChange);
      window.removeEventListener("storage", handleGitHubConnectionChange);
    };
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setInitialPrompt("");
        setTaskKey((key) => key + 1);
        setCurrentView("chat");
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function saveProjects(next: ProjectSummary[]) {
    setProjects(next);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(next));
  }

  function saveProjectWorkspace(id: string, files: WorkspaceFile[]) {
    const workspaces = JSON.parse(localStorage.getItem(PROJECT_WORKSPACES_STORAGE_KEY) || "{}") as Record<string, WorkspaceFile[]>;
    workspaces[id] = files;
    localStorage.setItem(PROJECT_WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
  }

  function openProject(project: ProjectSummary) {
    const workspaces = JSON.parse(localStorage.getItem(PROJECT_WORKSPACES_STORAGE_KEY) || "{}") as Record<string, WorkspaceFile[]>;
    const files = workspaces[project.id] || [];
    setProjectName(project.name);
    setWorkspaceFiles(files);
    setOpenFiles(files.slice(0, 1));
    setActiveFilePath(files[0]?.path || null);
    setCurrentView("chat");
  }

  function rememberProject(name: string, source: string, fileCount: number) {
    setProjects((current) => {
      const existing = current.find((project) => project.name === name);
      const project: ProjectSummary = { id: existing?.id || crypto.randomUUID(), name, source, fileCount, updated: "Just now", pinned: existing?.pinned || false };
      const next = [project, ...current.filter((item) => item.id !== existing?.id)];
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function startNewTask(prompt = "") {
    setInitialPrompt(prompt);
    setActiveConversationId(null);
    setTaskKey((key) => key + 1);
    setCurrentView("chat");
  }

  function handleConversationCreated(id: number) {
    setActiveConversationId(id);
    setCurrentView("chat");
  }

  function reviewFile(file: WorkspaceFile) {
    setWorkspaceFiles((current) => {
      const byPath = new Map(current.map((item) => [item.path, item]));
      byPath.set(file.path, file);
      return Array.from(byPath.values());
    });
    setOpenFiles((current) => {
      const existing = current.find((item) => item.path === file.path);
      return existing ? current.map((item) => item.path === file.path ? file : item) : [...current, file];
    });
    setActiveFilePath(file.path);
    setInspectorOpen(true);
  }

  function closeOpenFile(path: string) {
    setOpenFiles((current) => {
      const next = current.filter((file) => file.path !== path);
      if (activeFilePath === path) setActiveFilePath(next[0]?.path || null);
      return next;
    });
  }

  async function importFiles(event: ChangeEvent<HTMLInputElement>, folder: boolean) {
    const files = Array.from(event.target.files || []).filter((file) => file.size <= 1_000_000);
    if (!files.length) return;
    const imported = await Promise.all(files.map(async (file) => ({ path: file.webkitRelativePath || file.name, content: await file.text(), language: languageFor(file.name) })));
    setWorkspaceFiles((current) => {
      const byPath = new Map(current.map((file) => [file.path, file]));
      imported.forEach((file) => byPath.set(file.path, file));
      return Array.from(byPath.values());
    });
    const name = folder && imported[0].path.includes("/") ? imported[0].path.split("/")[0] : projectName || "Local files";
    setProjectName(name);
    rememberProject(name, folder ? "Local folder" : "Local files", imported.length);
    setSidebarSection("files");
    setCurrentView("chat");
    event.target.value = "";
  }

  async function createProject() {
    const name = newProjectName.trim() || "Untitled project";
    const files: WorkspaceFile[] = template === "nextjs"
      ? [
          { path: "package.json", language: "json", content: JSON.stringify({ name: name.toLowerCase().replace(/\s+/g, "-"), private: true, scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest" } }, null, 2) },
          { path: "src/app/page.tsx", language: "tsx", content: "export default function Page() {\n  return <main>Hello world</main>;\n}\n" },
        ]
      : template === "python"
        ? [{ path: "main.py", language: "python", content: "def main():\n    print(\"Hello world\")\n\nif __name__ == \"__main__\":\n    main()\n" }]
        : [{ path: "README.md", language: "markdown", content: `# ${name}\n` }];
    const project: ProjectSummary = {
      id: crypto.randomUUID(),
      name,
      source: template === "nextjs" ? "Next.js" : template === "python" ? "Python" : "Blank",
      fileCount: files.length,
      updated: "Just now",
      pinned: false,
    };
    const picker = window as DirectoryPickerWindow;
    if (picker.showDirectoryPicker) {
      try {
        const parent = await picker.showDirectoryPicker({ mode: "readwrite" });
        const folder = await parent.getDirectoryHandle(name.replace(/[\\/:*?"<>|]/g, "-") || "untitled-project", { create: true });
        for (const file of files) {
          const parts = file.path.split("/");
          const filename = parts.pop()!;
          let directory = folder;
          for (const part of parts) directory = await directory.getDirectoryHandle(part, { create: true });
          const writable = await (await directory.getFileHandle(filename, { create: true })).createWritable();
          await writable.write(file.content);
          await writable.close();
        }
        project.source = `Local folder: ${parent.name}`;
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") project.source = "Browser workspace backup";
      }
    } else {
      project.source = "Browser workspace backup";
    }
    setProjectName(name);
    setWorkspaceFiles(files);
    setOpenFiles(files.slice(0, 1));
    setActiveFilePath(files[0]?.path || null);
    saveProjectWorkspace(project.id, files);
    saveProjects([project, ...projects.filter((item) => item.name !== name)]);
    setNewProjectOpen(false);
    setNewProjectName("");
    setInitialPrompt("");
    setCurrentView("chat");
  }

  const activePluginNames = AGENT_PLUGINS.filter((plugin) => enabledPlugins.includes(plugin.id)).map((plugin) => plugin.name);
  const githubEnabled = enabledPlugins.includes("github");
  const activeGithubConnection = githubEnabled ? githubConnection : null;

  function selectGitHubBranch(branch: string) {
    if (!githubConnection) return;
    const next = { ...githubConnection, branch };
    setGithubConnection(next);
    saveGitHubConnection(next);
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#1a1a1a] text-[#e5e5e5] font-mono">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => void importFiles(event, false)} />
      <input ref={folderInputRef} type="file" multiple className="hidden" {...directoryInputProps} onChange={(event) => void importFiles(event, true)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-30 md:hidden" />
      )}

      {/* LEFT SIDEBAR — Claude Code style */}
      {sidebarOpen && (
        <aside className="absolute inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[#2a2a2a] bg-[#161616] md:relative md:z-auto">
          {/* Sidebar Header */}
          <div className="flex h-10 items-center gap-2 border-b border-[#2a2a2a] px-3">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-500/90 text-white">
              <Bot className="h-3 w-3" />
            </div>
            <span className="text-[12px] font-semibold text-[#e5e5e5] tracking-wide uppercase">SEA</span>
            <button
              onClick={() => { setInitialPrompt(""); setTaskKey((k) => k + 1); setCurrentView("chat"); }}
              className="ml-auto rounded p-1 text-[#666] hover:bg-[#2a2a2a] hover:text-[#e5e5e5] transition-colors"
              title="New task (⌘N)"
            >
              <SquarePen className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Section tabs: History | Files */}
          <div className="flex border-b border-[#2a2a2a]">
            <button
              onClick={() => setSidebarSection("history")}
              className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${sidebarSection === "history" ? "text-orange-400 border-b border-orange-400" : "text-[#666] hover:text-[#aaa]"}`}
            >
              History
            </button>
            <button
              onClick={() => setSidebarSection("files")}
              className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${sidebarSection === "files" ? "text-orange-400 border-b border-orange-400" : "text-[#666] hover:text-[#aaa]"}`}
            >
              Files {workspaceFiles.length > 0 && <span className="ml-1 text-[10px] text-[#555]">({workspaceFiles.length})</span>}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sidebarSection === "history" ? (
              <div className="py-1">
                {conversationsLoading ? (
                  <div className="px-3 py-3 text-[11px] text-[#555]">Loading…</div>
                ) : conversations.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <p className="text-[11px] text-[#555]">No tasks yet</p>
                    <p className="mt-1 text-[10px] text-[#444]">Start a new task below</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => { setActiveConversationId(conv.id); setCurrentView("chat"); if (window.innerWidth < 768) setSidebarOpen(false); }}
                      className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${currentView === "chat" && activeConversationId === conv.id ? "bg-[#2a2a2a] text-[#e5e5e5]" : "text-[#888] hover:bg-[#202020] hover:text-[#ccc]"}`}
                    >
                      <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[#555]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] leading-snug">{conv.title || "New Task"}</p>
                        <p className="text-[10px] text-[#555] mt-0.5">{new Date(conv.updated_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col">
                {workspaceFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-8">
                    <FolderOpen className="h-8 w-8 text-[#444]" />
                    <p className="text-center text-[11px] text-[#555]">No files loaded</p>
                    <button
                      onClick={() => folderInputRef.current?.click()}
                      className="rounded border border-[#333] bg-[#222] px-3 py-1.5 text-[11px] text-[#888] hover:bg-[#2a2a2a] hover:text-[#ccc] transition-colors"
                    >
                      Open folder
                    </button>
                  </div>
                ) : (
                  <FileExplorer files={workspaceFiles} onFileSelect={(path) => { const file = workspaceFiles.find((f) => f.path === path); if (file) reviewFile(file); }} />
                )}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-[#2a2a2a] p-2 space-y-0.5">
            <button onClick={() => folderInputRef.current?.click()} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] text-[#666] hover:bg-[#2a2a2a] hover:text-[#ccc] transition-colors">
              <FolderOpen className="h-3.5 w-3.5" /> Open Folder
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] text-[#666] hover:bg-[#2a2a2a] hover:text-[#ccc] transition-colors">
              <FilePlus2 className="h-3.5 w-3.5" /> Add Files
            </button>
            <button onClick={() => { setCurrentView("plugins"); }} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] text-[#666] hover:bg-[#2a2a2a] hover:text-[#ccc] transition-colors">
              <Plug className="h-3.5 w-3.5" /> Plugins
            </button>
            <button onClick={onOpenSettings} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] text-[#666] hover:bg-[#2a2a2a] hover:text-[#ccc] transition-colors">
              <Settings className="h-3.5 w-3.5" /> Settings
            </button>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <section className="relative flex min-w-0 flex-1 flex-col bg-[#1a1a1a]">

        {/* Top Bar */}
        <header className="flex h-10 shrink-0 items-center gap-2 border-b border-[#2a2a2a] bg-[#161616] px-3">
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            className="rounded p-1 text-[#555] hover:bg-[#2a2a2a] hover:text-[#ccc] transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px]">
            <span className="text-[#555]">sea</span>
            {projectName && (
              <>
                <span className="text-[#444]">/</span>
                <span className="truncate text-[#888]">{projectName}</span>
              </>
            )}
            {activeGithubConnection && (
              <>
                <span className="text-[#444]">/</span>
                <GitBranch className="h-3 w-3 text-[#555]" />
                <span className="text-[#888]">{activeGithubConnection.branch}</span>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTerminalOpen((open) => !open)}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors ${terminalOpen ? "bg-orange-500/20 text-orange-400" : "text-[#555] hover:bg-[#2a2a2a] hover:text-[#ccc]"}`}
              title="Toggle terminal"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="hidden sm:inline">Terminal</span>
            </button>
            <button
              onClick={() => { setCurrentView("projects"); }}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[#555] hover:bg-[#2a2a2a] hover:text-[#ccc] transition-colors"
            >
              <Folder className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Projects</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        {currentView === "projects" ? (
          <div className="flex-1 overflow-auto">
            <ProjectsView projects={projects} onNewProject={() => setNewProjectOpen(true)} onOpenFolder={() => folderInputRef.current?.click()} onOpenProject={openProject} onTogglePin={(id) => saveProjects(projects.map((project) => project.id === id ? { ...project, pinned: !project.pinned } : project))} onRemoveProject={(id) => saveProjects(projects.filter((project) => project.id !== id))} />
          </div>
        ) : currentView === "scheduled" ? (
          <div className="flex-1 overflow-auto"><ScheduledView onRun={startNewTask} /></div>
        ) : currentView === "plugins" ? (
          <div className="flex-1 overflow-auto"><PluginsView enabled={enabledPlugins} onChange={setEnabledPlugins} /></div>
        ) : currentView === "pullRequests" ? (
          <div className="flex-1 overflow-auto"><PullRequestsView enabled={githubEnabled} /></div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Chat Area */}
            <div className="min-h-0 flex-1 overflow-hidden">
              <AgentChat
                key={taskKey}
                conversationId={activeConversationId}
                activeFile={openFiles.find((file) => file.path === activeFilePath) || null}
                workspaceFiles={enabledPlugins.includes("workspace") ? workspaceFiles : []}
                initialPrompt={initialPrompt}
                enabledPlugins={activePluginNames}
                githubContext={activeGithubConnection ? { repository: activeGithubConnection.repository, branch: activeGithubConnection.branch } : null}
                onConversationCreated={handleConversationCreated}
                onReviewFile={reviewFile}
                onOpenFolder={() => folderInputRef.current?.click()}
                onAddFiles={() => fileInputRef.current?.click()}
                onNewProject={() => setNewProjectOpen(true)}
              />
            </div>

            {/* Terminal Panel */}
            {terminalOpen && (
              <div className="h-48 shrink-0 border-t border-[#2a2a2a]">
                <AgentTerminal lines={terminalLines} />
              </div>
            )}
          </div>
        )}

        {/* Status Bar — Like Claude Code / VS Code */}
        <div className="flex h-6 shrink-0 items-center gap-4 border-t border-[#2a2a2a] bg-[#161616] px-3 text-[10px] text-[#555]">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${true ? "bg-green-500" : "bg-yellow-500"}`} />
            SEA
          </span>
          {projectName && <span className="text-[#444]">{projectName}</span>}
          {workspaceFiles.length > 0 && <span className="text-[#444]">{workspaceFiles.length} files</span>}
          <span className="ml-auto flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            Skilled Eagle Agent
          </span>
        </div>
      </section>

      {/* New Project Modal */}
      {newProjectOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={(event) => { event.preventDefault(); void createProject(); }}
            className="w-full max-w-md rounded-lg border border-[#333] bg-[#1e1e1e] p-5 shadow-2xl font-sans">
            <h2 className="font-semibold text-[#e5e5e5]">New Project</h2>
            <p className="mt-1 text-xs text-[#666]">SEA will save starter files to a local folder and keep a browser backup.</p>
            <label className="mt-4 block text-xs text-[#666]">Project name</label>
            <input autoFocus value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="my-project" className="mt-1.5 w-full rounded border border-[#333] bg-[#161616] px-3 py-2 text-sm text-[#e5e5e5] outline-none focus:border-orange-500/60 placeholder:text-[#444]" />
            <label className="mt-3 block text-xs text-[#666]">Template</label>
            <select value={template} onChange={(event) => setTemplate(event.target.value)} className="mt-1.5 w-full rounded border border-[#333] bg-[#161616] px-3 py-2 text-sm text-[#e5e5e5] outline-none">
              <option value="blank">Blank</option>
              <option value="nextjs">Next.js</option>
              <option value="python">Python</option>
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setNewProjectOpen(false)} className="rounded px-3 py-2 text-sm text-[#666] hover:text-[#ccc] transition-colors">Cancel</button>
              <button type="submit" className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
