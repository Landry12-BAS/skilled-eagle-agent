"use client";

import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, Cloud, FileCode2, FileText, GitPullRequest, Globe2, Image, ListTodo, MoreHorizontal, Plug, Search, Settings } from "lucide-react";
import Cookies from "js-cookie";
import { GITHUB_CONNECTION_STORAGE_KEY, GITHUB_OAUTH_EVENT, consumeGitHubOAuthResult, getGitHubOAuthUrl, githubErrorMessage, githubHeaders, loadAuthenticatedGitHubUser, loadGitHubAccount, loadGitHubConnection, loadGitHubToken, parseGitHubRepository, saveGitHubAccount, saveGitHubConnection, saveGitHubToken, type GitHubOAuthResult } from "./githubConnection";

export interface AgentPlugin {
  id: string;
  name: string;
  description: string;
  category: "featured" | "productivity";
  installed?: boolean;
}

export const AGENT_PLUGINS: AgentPlugin[] = [
  { id: "workspace", name: "Workspace files", description: "Give SEA context from imported project files.", category: "featured", installed: true },
  { id: "github", name: "GitHub", description: "Triage PRs, inspect branches, and pull repository changes.", category: "featured", installed: true },
  { id: "web", name: "Web context", description: "Research public web context while working.", category: "featured" },
  { id: "vision", name: "Vision", description: "Analyze images attached to coding tasks.", category: "featured" },
  { id: "documents", name: "Documents", description: "Attach docs and PDFs as project context.", category: "featured" },
  { id: "analytics", name: "Data analytics", description: "Summarize data and generate implementation insights.", category: "featured" },
  { id: "notion", name: "Notion", description: "Use specs, research notes, and task docs as context.", category: "productivity" },
  { id: "calendar", name: "Google Calendar", description: "Plan scheduled engineering work.", category: "productivity" },
  { id: "dropbox", name: "Dropbox", description: "Reference shared project files.", category: "productivity" },
  { id: "linear", name: "Linear", description: "Turn issues into SEA implementation tasks.", category: "productivity" },
];

export const PLUGIN_STORAGE_KEY = "sea-enabled-plugins";
const icons = { workspace: FileCode2, github: GitPullRequest, web: Globe2, vision: Image, documents: FileText, analytics: BarChart3, notion: FileText, calendar: CalendarDays, dropbox: Cloud, linear: ListTodo };

interface PluginRowProps {
  plugin: AgentPlugin;
  active: boolean;
  repository: string;
  githubToken: string;
  githubAccount: string;
  branch: string;
  branches: string[];
  githubError: string;
  loadingBranches: boolean;
  onToggle: (id: string) => void;
  onRepositoryChange: (value: string) => void;
  onGithubTokenChange: (value: string) => void;
  onConnectGitHub: () => void;
  onOAuthGitHub: () => void;
  onBranchChange: (value: string) => void;
}

function PluginRow({ plugin, active, repository, githubToken, githubAccount, branch, branches, githubError, loadingBranches, onToggle, onRepositoryChange, onGithubTokenChange, onConnectGitHub, onOAuthGitHub, onBranchChange }: PluginRowProps) {
  const Icon = icons[plugin.id as keyof typeof icons] || Plug;
  return (
    <div className="py-5">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-card">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{plugin.name}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{plugin.description}</p>
        </div>
        <button type="button" onClick={() => onToggle(plugin.id)} className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
          {plugin.installed ? active ? "Installed" : "Install" : active ? "Enabled" : "Install"}
        </button>
        <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`${plugin.name} options`}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      {plugin.id === "github" && active && (
        <div className="ml-16 mt-3 max-w-xl space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOAuthGitHub} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent">{githubAccount ? "Reconnect GitHub" : "Sign in with GitHub"}</button>
            {githubAccount && <span className="text-xs text-emerald-500">Connected as @{githubAccount}</span>}
          </div>
          <div className="flex gap-2">
            <input value={repository} onChange={(event) => onRepositoryChange(event.target.value)} placeholder="owner/repository or GitHub URL" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none" />
            <button type="button" onClick={onConnectGitHub} disabled={loadingBranches} className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-50">{loadingBranches ? "Connecting" : "Connect"}</button>
          </div>
          {!githubAccount && <input value={githubToken} onChange={(event) => onGithubTokenChange(event.target.value)} placeholder="Fine-grained GitHub token for private repos" type="password" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none" />}
          {branches.length > 0 && <select value={branch} onChange={(event) => onBranchChange(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none">{branches.map((name) => <option key={name} value={name}>{name}</option>)}</select>}
          {githubError && <p className="text-xs text-red-400">{githubError}</p>}
        </div>
      )}
    </div>
  );
}

export function PluginsView({ enabled, onChange }: { enabled: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"public" | "personal">("public");
  const [repository, setRepository] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [githubAccount, setGithubAccount] = useState("");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [githubError, setGithubError] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const connection = loadGitHubConnection();
      setGithubToken(loadGitHubToken());
      setGithubAccount(loadGitHubAccount());
      if (connection) {
        setRepository(connection.repository);
        setBranch(connection.branch);
        setBranches(connection.branches);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function applyOAuthResult(result: GitHubOAuthResult | null) {
      if (!result || result.type !== GITHUB_OAUTH_EVENT) return;
      if (result.error) {
        setGithubError(result.error);
        return;
      }
      if (result.token) {
        saveGitHubToken(result.token);
        setGithubToken(result.token);
        const account = result.account || "GitHub";
        saveGitHubAccount(account);
        setGithubAccount(account);
        setGithubError("");
      }
    }
    function handleGitHubOAuth(event: MessageEvent) {
      applyOAuthResult(event.data as GitHubOAuthResult);
    }
    function handleGitHubStorage(event: StorageEvent) {
      if (event.key === "sea-github-oauth-result") applyOAuthResult(consumeGitHubOAuthResult());
    }
    const channel = new BroadcastChannel(GITHUB_OAUTH_EVENT);
    channel.onmessage = (event) => applyOAuthResult(event.data as GitHubOAuthResult);
    applyOAuthResult(consumeGitHubOAuthResult());
    window.addEventListener("message", handleGitHubOAuth);
    window.addEventListener("storage", handleGitHubStorage);
    return () => {
      channel.close();
      window.removeEventListener("message", handleGitHubOAuth);
      window.removeEventListener("storage", handleGitHubStorage);
    };
  }, []);

  function toggle(id: string) {
    const next = enabled.includes(id) ? enabled.filter((item) => item !== id) : [...enabled, id];
    onChange(next);
    localStorage.setItem(PLUGIN_STORAGE_KEY, JSON.stringify(next));
  }

  async function connectGitHub() {
    const path = parseGitHubRepository(repository);
    if (!path) { setGithubError("Enter a repository as owner/name or GitHub URL."); return; }
    setLoadingBranches(true);
    setGithubError("");
    try {
      saveGitHubToken(githubToken);
      if (githubToken && !githubAccount) {
        const account = await loadAuthenticatedGitHubUser(githubToken);
        saveGitHubAccount(account);
        setGithubAccount(account);
      }
      const response = await fetch(`https://api.github.com/repos/${path}/branches?per_page=100`, { headers: githubHeaders(githubToken) });
      if (!response.ok) throw new Error(githubErrorMessage(response.status));
      const data = await response.json() as Array<{ name: string }>;
      const names = data.map((item) => item.name);
      const nextBranch = names.includes(branch) ? branch : names[0] || "main";
      saveGitHubConnection({ repository: path, branch: nextBranch, branches: names });
      setRepository(path);
      setBranch(nextBranch);
      setBranches(names);
      if (!enabled.includes("github")) {
        const next = [...enabled, "github"];
        onChange(next);
        localStorage.setItem(PLUGIN_STORAGE_KEY, JSON.stringify(next));
      }
      window.dispatchEvent(new Event(GITHUB_CONNECTION_STORAGE_KEY));
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Unable to connect GitHub.");
    } finally {
      setLoadingBranches(false);
    }
  }

  async function startGitHubOAuth() {
    const appToken = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
    if (!appToken) { setGithubError("Sign in to SEA before connecting GitHub."); return; }
    try {
      setGithubError("");
      const authorizationUrl = await getGitHubOAuthUrl(appToken);
      window.open(authorizationUrl, "sea-github-oauth", "width=980,height=780");
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Unable to start GitHub OAuth.");
    }
  }

  function selectBranch(value: string) {
    setBranch(value);
    const path = parseGitHubRepository(repository);
    if (!path) return;
    saveGitHubConnection({ repository: path, branch: value, branches });
    window.dispatchEvent(new Event(GITHUB_CONNECTION_STORAGE_KEY));
  }

  const visiblePlugins = AGENT_PLUGINS.filter((plugin) => {
    if (tab === "personal" && !enabled.includes(plugin.id)) return false;
    const query = search.trim().toLowerCase();
    return !query || plugin.name.toLowerCase().includes(query) || plugin.description.toLowerCase().includes(query);
  });
  const installedPlugins = AGENT_PLUGINS.filter((plugin) => enabled.includes(plugin.id));

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-9">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Plugins</h1>
        <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-lg">Work with SEA across your favorite tools</p>

        <div className="relative mt-9">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plugins" className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 text-base outline-none focus:border-foreground/40" />
        </div>

        <div className="mt-8 flex items-center justify-between border-b border-border pb-5 sm:mt-12">
          <h2 className="text-xl font-semibold">Installed</h2>
          <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Plugin settings"><Settings className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {installedPlugins.length ? installedPlugins.map((plugin) => {
            const Icon = icons[plugin.id as keyof typeof icons] || Plug;
            return <div key={plugin.id} className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-card"><Icon className="h-6 w-6" /></div>;
          }) : <p className="text-sm text-muted-foreground">No plugins installed.</p>}
        </div>

        <div className="mt-8 flex items-center gap-2 sm:mt-12">
          <button type="button" onClick={() => setTab("public")} className={`rounded-xl px-4 py-2 text-sm ${tab === "public" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Public</button>
          <button type="button" onClick={() => setTab("personal")} className={`rounded-xl px-4 py-2 text-sm ${tab === "personal" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Personal</button>
        </div>

        {(["featured", "productivity"] as const).map((category) => {
          const items = visiblePlugins.filter((plugin) => plugin.category === category);
          if (!items.length) return null;
          return (
            <section key={category} className="mt-8 sm:mt-12">
              <h2 className="border-b border-border pb-5 text-xl font-semibold capitalize">{category}</h2>
              <div className="grid gap-x-14 divide-y divide-border md:grid-cols-2">
                {items.map((plugin) => (
                  <PluginRow
                    key={plugin.id}
                    plugin={plugin}
                    active={enabled.includes(plugin.id)}
                    repository={repository}
                    githubToken={githubToken}
                    githubAccount={githubAccount}
                    branch={branch}
                    branches={branches}
                    githubError={githubError}
                    loadingBranches={loadingBranches}
                    onToggle={toggle}
                    onRepositoryChange={setRepository}
                    onGithubTokenChange={setGithubToken}
                    onConnectGitHub={() => void connectGitHub()}
                    onOAuthGitHub={() => void startGitHubOAuth()}
                    onBranchChange={selectBranch}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {!visiblePlugins.length && (
          <div className="mt-16 text-center text-sm text-muted-foreground">No plugins found.</div>
        )}
        </div>
      </div>
  );
}
