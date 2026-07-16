"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import { Bot, ChevronDown, Clock, Command, FilePlus2, Folder, FolderOpen, GitBranch, GitPullRequest, PanelBottomClose, PanelBottomOpen, PanelLeft, PanelRightClose, PanelRightOpen, Plug, Plus, Search, Settings, SlidersHorizontal, Sparkles, SquarePen } from "lucide-react";
import { AgentChat } from "./AgentChat";
import { CodeEditor } from "./CodeEditor";
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
const terminalLines = [
  { type: "info" as const, content: "Skilled Eagle workspace ready" },
  { type: "output" as const, content: "Ask SEA to inspect, explain, or modify your project." },
];

function languageFor(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() || "text";
  return ({ ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx", py: "python", json: "json", md: "markdown", css: "css", html: "html" } as Record<string, string>)[extension] || extension;
}

export function SEAInterface({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const syncMobileLayout = () => {
      if (!media.matches) return;
      setSidebarOpen(false);
      setInspectorOpen(false);
      setTerminalOpen(false);
    };

    syncMobileLayout();
    media.addEventListener("change", syncMobileLayout);
    return () => media.removeEventListener("change", syncMobileLayout);
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      const token = Cookies.get("access_token") || localStorage.getItem("access_token");
      if (!token) {
        setConversationsLoading(false);
        return;
      }
      try {
        const data = await getConversations(token, "", "sea");
        setConversations(Array.isArray(data) ? data : (data.results || []));
      } catch {
        // silently fail
      } finally {
        setConversationsLoading(false);
      }
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
    function handleGitHubConnectionChange() {
      setGithubConnection(loadGitHubConnection());
    }
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
      return existing
        ? current.map((item) => item.path === file.path ? file : item)
        : [...current, file];
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
    setCurrentView("chat");
    event.target.value = "";
  }

  function createProject() {
    const name = newProjectName.trim() || "Untitled project";
    const files: WorkspaceFile[] = template === "nextjs"
      ? [
          { path: "package.json", language: "json", content: JSON.stringify({ name: name.toLowerCase().replace(/\s+/g, "-"), private: true, scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest" } }, null, 2) },
          { path: "src/app/page.tsx", language: "tsx", content: "export default function Page() {\n  return <main>Hello world</main>;\n}\n" },
        ]
      : template === "python"
        ? [{ path: "main.py", language: "python", content: "def main():\n    print(\"Hello world\")\n\nif __name__ == \"__main__\":\n    main()\n" }]
        : [{ path: "README.md", language: "markdown", content: `# ${name}\n` }];
    setProjectName(name);
    setWorkspaceFiles(files);
    rememberProject(name, template === "nextjs" ? "Next.js" : template === "python" ? "Python" : "Blank", files.length);
    setNewProjectOpen(false);
    setNewProjectName("");
    startNewTask("Help me build this new project.");
  }

  const navItems: Array<{ view: "scheduled" | "plugins" | "pullRequests"; label: string; icon: typeof Clock }> = [
    { view: "scheduled", label: "Scheduled", icon: Clock },
    { view: "plugins", label: "Plugins", icon: Plug },
    { view: "pullRequests", label: "Pull requests", icon: GitPullRequest },
  ];
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
    <div className="relative flex h-full w-full overflow-hidden bg-background text-foreground">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => void importFiles(event, false)} />
      <input ref={folderInputRef} type="file" multiple className="hidden" {...directoryInputProps} onChange={(event) => void importFiles(event, true)} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close SEA navigation"
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden"
        />
      )}
      {sidebarOpen && (
        <aside className="absolute inset-y-0 left-0 z-40 flex w-72 max-w-[86vw] shrink-0 flex-col border-r border-border bg-card shadow-2xl md:relative md:z-auto md:w-64 md:max-w-none md:shadow-none">
          <div className="flex h-12 items-center gap-2 border-b border-border px-3">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background"><Bot className="h-4 w-4" /></div>
            <span className="text-sm font-semibold">Skilled Eagle</span>
            <button className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Search tasks"><Search className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
            <button onClick={() => startNewTask()} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${currentView === "chat" ? "bg-accent/50" : "hover:bg-accent"}`}><SquarePen className="h-5 w-5 opacity-70" /><span>New task</span><span className="ml-auto flex items-center gap-0.5 rounded-md border border-border/50 bg-background/50 px-1.5 py-0.5 text-[11px] text-muted-foreground"><Command className="h-3 w-3" />N</span></button>
            <div className="space-y-0.5 pt-2">
              <div className={`group flex items-center rounded-xl pr-2 ${currentView === "projects" ? "bg-accent/50" : "hover:bg-accent"}`}><button onClick={() => { setCurrentView("projects"); if (window.innerWidth < 768) setSidebarOpen(false); }} className="flex flex-1 items-center gap-3 px-3 py-2.5 text-sm"><Folder className="h-5 w-5 opacity-70" />Projects</button><button onClick={() => setNewProjectOpen(true)} className="rounded-md p-1 hover:bg-background/80" aria-label="New project"><Plus className="h-4 w-4" /></button></div>
              {navItems.map((item) => { const Icon = item.icon; return <button key={item.view} onClick={() => { setCurrentView(item.view); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${currentView === item.view ? "bg-accent/50" : "hover:bg-accent"}`}><Icon className="h-5 w-5 opacity-70" />{item.label}</button>; })}
            </div>
            
            <div className="pt-6 pb-2">
              <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tasks
              </div>
              <div className="space-y-0.5">
                {conversationsLoading ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No tasks yet</div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setCurrentView("chat");
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition-colors ${currentView === "chat" && activeConversationId === conv.id ? "bg-accent/50" : "hover:bg-accent"}`}
                    >
                      <span className="text-sm font-medium line-clamp-1">{conv.title || "New Task"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-border p-2"><button onClick={onOpenSettings} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Settings className="h-4 w-4" /> Settings</button></div>
        </aside>
      )}

      <section className="relative flex min-w-0 flex-1 flex-col bg-background">
        {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="absolute left-3 top-3 z-30 rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground" aria-label="Show sidebar"><PanelLeft className="h-5 w-5" strokeWidth={1.8} /></button>}
        {currentView === "projects" ? (
          <ProjectsView projects={projects} onNewProject={() => setNewProjectOpen(true)} onOpenFolder={() => folderInputRef.current?.click()} onOpenProject={(project) => { setProjectName(project.name); setCurrentView("chat"); }} onTogglePin={(id) => saveProjects(projects.map((project) => project.id === id ? { ...project, pinned: !project.pinned } : project))} onRemoveProject={(id) => saveProjects(projects.filter((project) => project.id !== id))} />
        ) : currentView === "scheduled" ? (
          <ScheduledView onRun={startNewTask} />
        ) : currentView === "plugins" ? (
          <PluginsView enabled={enabledPlugins} onChange={setEnabledPlugins} />
        ) : currentView === "pullRequests" ? (
          <PullRequestsView enabled={githubEnabled} />
        ) : (
          <>
            <header className="flex h-12 shrink-0 items-center border-b border-border bg-muted/50 px-2 sm:px-3">
              <button onClick={() => setSidebarOpen((open) => !open)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"} aria-pressed={sidebarOpen}><PanelLeft className="h-5 w-5" strokeWidth={1.8} /></button>
              <div className="ml-2 min-w-0"><h1 className="truncate text-[13px] font-medium">New task</h1><div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">{projectName || activeGithubConnection ? <><span>{projectName || activeGithubConnection?.repository}</span>{activeGithubConnection && <><span>·</span><GitBranch className="h-3 w-3" /><span>{activeGithubConnection.branch}</span><ChevronDown className="h-3 w-3" /></>}</> : <span>No project</span>}</div></div>
              <div className="relative ml-auto flex shrink-0 items-center gap-1">
                <button onClick={() => setSummaryOpen((open) => !open)} className={`rounded-md p-1.5 ${summaryOpen ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`} aria-label={summaryOpen ? "Hide summary" : "Show summary"} title={summaryOpen ? "Hide summary" : "Show summary"}><SlidersHorizontal className="h-4 w-4" /></button>
                <button onClick={() => setTerminalOpen((open) => !open)} className={`rounded-md p-1.5 ${terminalOpen ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`} aria-label={terminalOpen ? "Hide terminal" : "Show terminal"} title={terminalOpen ? "Hide terminal" : "Show terminal"}>{terminalOpen ? <PanelBottomClose className="h-4 w-4" /> : <PanelBottomOpen className="h-4 w-4" />}</button>
                <button onClick={() => setInspectorOpen((open) => !open)} className={`rounded-md p-1.5 ${inspectorOpen ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`} aria-label={inspectorOpen ? "Hide workspace panel" : "Show workspace panel"} title={inspectorOpen ? "Hide workspace panel" : "Show workspace panel"}>{inspectorOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}</button>
              </div>
            </header>
            {summaryOpen && (
              <div className="shrink-0 border-b border-border bg-card/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md border border-border bg-background px-2 py-1">Summary</span>
                  <span className="rounded-md border border-border bg-background px-2 py-1">{projectName || "No project"}</span>
                  {activeGithubConnection && <span className="rounded-md border border-border bg-background px-2 py-1">{activeGithubConnection.repository}:{activeGithubConnection.branch}</span>}
                  <span className="rounded-md border border-border bg-background px-2 py-1">{workspaceFiles.length} files</span>
                  <span className="rounded-md border border-border bg-background px-2 py-1">{activePluginNames.length} plugins</span>
                  <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => startNewTask()} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent hover:text-foreground"><SquarePen className="h-3.5 w-3.5" /> New task</button>
                    <button type="button" onClick={() => setNewProjectOpen(true)} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent hover:text-foreground"><Sparkles className="h-3.5 w-3.5" /> Start project</button>
                    <button type="button" onClick={() => folderInputRef.current?.click()} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent hover:text-foreground"><FolderOpen className="h-3.5 w-3.5" /> Open folder</button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent hover:text-foreground"><FilePlus2 className="h-3.5 w-3.5" /> Add files</button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="min-h-0 flex-1">
                  <AgentChat key={taskKey} conversationId={activeConversationId} activeFile={openFiles.find((file) => file.path === activeFilePath) || null} workspaceFiles={enabledPlugins.includes("workspace") ? workspaceFiles : []} initialPrompt={initialPrompt} enabledPlugins={activePluginNames} githubContext={activeGithubConnection ? { repository: activeGithubConnection.repository, branch: activeGithubConnection.branch } : null} onConversationCreated={handleConversationCreated} onReviewFile={reviewFile} onOpenFolder={() => folderInputRef.current?.click()} onAddFiles={() => fileInputRef.current?.click()} onNewProject={() => setNewProjectOpen(true)} />
                </div>
                {terminalOpen && <div className="h-52 shrink-0 border-t border-border"><AgentTerminal lines={terminalLines} /></div>}
              </div>
              {inspectorOpen && (
                <aside className="hidden w-[420px] shrink-0 border-l border-border bg-card/70 md:flex md:flex-col">
                  <div className="border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">Workspace</h2><p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{projectName || "No project"}</p></div>
                  <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                    <section className="h-80 min-h-0 overflow-hidden rounded-lg border border-border bg-background">
                      <CodeEditor openFiles={openFiles} activeFile={activeFilePath} onTabSelect={setActiveFilePath} onTabClose={closeOpenFile} />
                    </section>
                    <section><div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span>Files</span><span>{workspaceFiles.length}</span></div><div className="space-y-1.5">{workspaceFiles.slice(0, 6).map((file) => <button type="button" key={file.path} onClick={() => reviewFile(file)} className="w-full truncate rounded-md border border-border/70 bg-background px-2 py-1.5 text-left font-mono text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">{file.path}</button>)}{workspaceFiles.length === 0 && <button type="button" onClick={() => folderInputRef.current?.click()} className="w-full rounded-md border border-dashed border-border px-2 py-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Open folder</button>}</div></section>
                    <section><div className="mb-2 text-xs text-muted-foreground">Plugins</div><div className="flex flex-wrap gap-1.5">{activePluginNames.length ? activePluginNames.map((name) => <span key={name} className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">{name}</span>) : <span className="text-xs text-muted-foreground">None</span>}</div></section>
                    {activeGithubConnection && <section><div className="mb-2 text-xs text-muted-foreground">GitHub</div><div className="rounded-md border border-border/70 bg-background p-2"><p className="truncate font-mono text-[11px] text-muted-foreground">{activeGithubConnection.repository}</p><select value={activeGithubConnection.branch} onChange={(event) => selectGitHubBranch(event.target.value)} className="mt-2 w-full rounded-md border border-border bg-card px-2 py-1.5 text-[11px] outline-none">{activeGithubConnection.branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select><button type="button" onClick={() => startNewTask(`Pull ${activeGithubConnection.repository} branch ${activeGithubConnection.branch} into the workspace, inspect the result, and report what changed.`)} className="mt-2 w-full rounded-md bg-foreground px-2 py-1.5 text-[11px] font-medium text-background">Pull branch with SEA</button></div></section>}
                    <section className="grid gap-1.5"><button type="button" onClick={() => setNewProjectOpen(true)} className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Sparkles className="h-4 w-4" /> Start project</button><button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><FilePlus2 className="h-4 w-4" /> Add files</button><button type="button" onClick={() => setCurrentView("plugins")} className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Plug className="h-4 w-4" /> Plugins</button><button type="button" onClick={() => setCurrentView("pullRequests")} className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><GitPullRequest className="h-4 w-4" /> Pull requests</button></section>
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </section>

      {newProjectOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); createProject(); }} className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl"><h2 className="font-semibold">Start a project</h2><p className="mt-1 text-xs text-muted-foreground">Create a fresh workspace and begin with SEA.</p><label className="mt-5 block text-xs text-muted-foreground">Project name</label><input autoFocus value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="My project" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none" /><label className="mt-4 block text-xs text-muted-foreground">Template</label><select value={template} onChange={(event) => setTemplate(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"><option value="blank">Blank</option><option value="nextjs">Next.js</option><option value="python">Python</option></select><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setNewProjectOpen(false)} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent">Cancel</button><button type="submit" className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">Create project</button></div></form></div>
      )}
    </div>
  );
}
