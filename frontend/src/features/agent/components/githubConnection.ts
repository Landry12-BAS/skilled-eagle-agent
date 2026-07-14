"use client";

export interface GitHubConnection {
  repository: string;
  branch: string;
  branches: string[];
}

export const GITHUB_CONNECTION_STORAGE_KEY = "sea-github-connection";
export const GITHUB_REPOSITORY_STORAGE_KEY = "sea-github-repository";
export const GITHUB_TOKEN_STORAGE_KEY = "sea-github-token";
export const GITHUB_ACCOUNT_STORAGE_KEY = "sea-github-account";
export const GITHUB_OAUTH_EVENT = "sea-github-oauth";
export const GITHUB_OAUTH_RESULT_STORAGE_KEY = "sea-github-oauth-result";
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export function parseGitHubRepository(value: string) {
  const match = value.trim().match(/^(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i);
  return match ? `${match[1]}/${match[2]}` : null;
}

export function loadGitHubConnection(): GitHubConnection | null {
  try {
    const raw = localStorage.getItem(GITHUB_CONNECTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GitHubConnection>;
    if (!parsed.repository || !parsed.branch || !Array.isArray(parsed.branches)) return null;
    return { repository: parsed.repository, branch: parsed.branch, branches: parsed.branches };
  } catch {
    return null;
  }
}

export function saveGitHubConnection(connection: GitHubConnection) {
  localStorage.setItem(GITHUB_CONNECTION_STORAGE_KEY, JSON.stringify(connection));
  localStorage.setItem(GITHUB_REPOSITORY_STORAGE_KEY, connection.repository);
}

export function loadGitHubToken() {
  return sessionStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || "";
}

export function saveGitHubToken(token: string) {
  const trimmed = token.trim();
  if (trimmed) {
    sessionStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, trimmed);
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, trimmed);
  } else {
    sessionStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
    localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
  }
}

export function loadGitHubAccount() {
  if (!loadGitHubToken()) return "";
  return localStorage.getItem(GITHUB_ACCOUNT_STORAGE_KEY) || "";
}

export function saveGitHubAccount(account: string) {
  const trimmed = account.trim();
  if (trimmed) localStorage.setItem(GITHUB_ACCOUNT_STORAGE_KEY, trimmed);
  else localStorage.removeItem(GITHUB_ACCOUNT_STORAGE_KEY);
}

export function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    ...(token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {}),
  };
}

export function githubErrorMessage(status: number) {
  if (status === 401) return "GitHub token is invalid or expired.";
  if (status === 403) return "GitHub API denied the request. Check token scopes or rate limits.";
  if (status === 404) return "Repository not found, private, or token has no access.";
  return "GitHub request failed.";
}

export async function getGitHubOAuthUrl(appAccessToken: string) {
  const response = await fetch(`${BACKEND_API_URL}/agent/github/oauth/start/?origin=${encodeURIComponent(window.location.origin)}`, {
    headers: { Authorization: `Bearer ${appAccessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Unable to start GitHub OAuth.");
  return data.authorization_url as string;
}

export async function loadAuthenticatedGitHubUser(token: string) {
  const response = await fetch("https://api.github.com/user", { headers: githubHeaders(token) });
  if (!response.ok) throw new Error(githubErrorMessage(response.status));
  const data = await response.json() as { login?: string };
  return data.login || "";
}

export interface GitHubOAuthResult {
  type: typeof GITHUB_OAUTH_EVENT;
  token?: string;
  account?: string;
  error?: string;
}

export function saveGitHubOAuthResult(result: GitHubOAuthResult) {
  localStorage.setItem(GITHUB_OAUTH_RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function consumeGitHubOAuthResult() {
  try {
    const raw = localStorage.getItem(GITHUB_OAUTH_RESULT_STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(GITHUB_OAUTH_RESULT_STORAGE_KEY);
    return JSON.parse(raw) as GitHubOAuthResult;
  } catch {
    localStorage.removeItem(GITHUB_OAUTH_RESULT_STORAGE_KEY);
    return null;
  }
}
