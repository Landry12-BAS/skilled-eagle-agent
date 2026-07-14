"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, GitPullRequest, Loader2, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";
import { GITHUB_CONNECTION_STORAGE_KEY, GITHUB_OAUTH_EVENT, GITHUB_REPOSITORY_STORAGE_KEY, consumeGitHubOAuthResult, getGitHubOAuthUrl, githubErrorMessage, githubHeaders, loadAuthenticatedGitHubUser, loadGitHubAccount, loadGitHubConnection, loadGitHubToken, parseGitHubRepository, saveGitHubAccount, saveGitHubConnection, saveGitHubToken, type GitHubOAuthResult } from "./githubConnection";

interface PullRequest { id: number; number: number; title: string; html_url: string; user: { login: string }; updated_at: string; draft: boolean; }

export function PullRequestsView({ enabled }: { enabled: boolean }) {
  const [repository, setRepository] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [githubAccount, setGithubAccount] = useState("");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const path = useMemo(() => parseGitHubRepository(repository), [repository]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const connection = loadGitHubConnection();
      setRepository(connection?.repository || localStorage.getItem(GITHUB_REPOSITORY_STORAGE_KEY) || "");
      setGithubToken(loadGitHubToken());
      setGithubAccount(loadGitHubAccount());
      setBranch(connection?.branch || "");
      setBranches(connection?.branches || []);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function applyOAuthResult(result: GitHubOAuthResult | null) {
      if (!result || result.type !== GITHUB_OAUTH_EVENT) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.token) {
        saveGitHubToken(result.token);
        setGithubToken(result.token);
        const account = result.account || "GitHub";
        saveGitHubAccount(account);
        setGithubAccount(account);
        setError("");
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

  async function loadPullRequests() {
    if (!enabled) { setError("Enable the GitHub plugin first."); return; }
    if (!path) { setError("Enter a GitHub repository as owner/name."); return; }
    setLoading(true); setError("");
    try {
      saveGitHubToken(githubToken);
      if (githubToken && !githubAccount) {
        const account = await loadAuthenticatedGitHubUser(githubToken);
        saveGitHubAccount(account);
        setGithubAccount(account);
      }
      const [branchesResponse, pullsResponse] = await Promise.all([
        fetch(`https://api.github.com/repos/${path}/branches?per_page=100`, { headers: githubHeaders(githubToken) }),
        fetch(`https://api.github.com/repos/${path}/pulls?state=open&per_page=30`, { headers: githubHeaders(githubToken) }),
      ]);
      if (!branchesResponse.ok) throw new Error(githubErrorMessage(branchesResponse.status));
      if (!pullsResponse.ok) throw new Error(githubErrorMessage(pullsResponse.status));
      const branchData = await branchesResponse.json() as Array<{ name: string }>;
      const names = branchData.map((item) => item.name);
      const nextBranch = names.includes(branch) ? branch : names[0] || "main";
      setBranches(names);
      setBranch(nextBranch);
      setPullRequests(await pullsResponse.json());
      localStorage.setItem(GITHUB_REPOSITORY_STORAGE_KEY, path);
      setRepository(path);
      saveGitHubConnection({ repository: path, branch: nextBranch, branches: names });
      window.dispatchEvent(new Event(GITHUB_CONNECTION_STORAGE_KEY));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load pull requests."); }
    finally { setLoading(false); }
  }

  async function startGitHubOAuth() {
    const appToken = Cookies.get("access_token") || localStorage.getItem("access_token") || "";
    if (!appToken) { setError("Sign in to SEA before connecting GitHub."); return; }
    try {
      setError("");
      const authorizationUrl = await getGitHubOAuthUrl(appToken);
      window.open(authorizationUrl, "sea-github-oauth", "width=980,height=780");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start GitHub OAuth.");
    }
  }

  function selectBranch(value: string) {
    if (!path) return;
    setBranch(value);
    saveGitHubConnection({ repository: path, branch: value, branches });
    window.dispatchEvent(new Event(GITHUB_CONNECTION_STORAGE_KEY));
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Pull requests</h1><p className="mt-1 text-sm text-muted-foreground">Review open pull requests from a GitHub repository.</p></div>{path && <a href={`https://github.com/${path}/pulls`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Open GitHub <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
        {!enabled && <div className="mt-7 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">Enable the GitHub plugin to connect a repository.</div>}
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => void startGitHubOAuth()} disabled={!enabled} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50">{githubAccount ? "Reconnect GitHub" : "Sign in with GitHub"}</button>
          {githubAccount && <span className="text-sm text-emerald-500">Connected as @{githubAccount}</span>}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void loadPullRequests(); }} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]"><input disabled={!enabled} value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="owner/repository or GitHub URL" className="min-w-0 rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none disabled:opacity-50" />{!githubAccount && <input disabled={!enabled} value={githubToken} onChange={(event) => setGithubToken(event.target.value)} placeholder="Token for private repos" type="password" className="min-w-0 rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none disabled:opacity-50" />}<button disabled={loading || !enabled} className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Connect</button></form>
        {branches.length > 0 && <select value={branch} onChange={(event) => selectBranch(event.target.value)} className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none">{branches.map((name) => <option key={name} value={name}>{name}</option>)}</select>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          {pullRequests.length ? pullRequests.map((pullRequest) => <a key={pullRequest.id} href={pullRequest.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-border p-4 last:border-0 hover:bg-accent/40"><GitPullRequest className="h-4 w-4 shrink-0 text-emerald-400" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{pullRequest.title}</p><p className="mt-1 text-xs text-muted-foreground">#{pullRequest.number} by {pullRequest.user.login} · updated {new Date(pullRequest.updated_at).toLocaleDateString()}</p></div>{pullRequest.draft && <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">Draft</span>}<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></a>) : <div className="py-16 text-center text-sm text-muted-foreground">{loading ? "Loading pull requests…" : "Connect a repository to see open pull requests."}</div>}
        </div>
      </div>
    </div>
  );
}
