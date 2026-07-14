"use client";

import { useEffect, useState } from "react";
import { GITHUB_OAUTH_EVENT, loadAuthenticatedGitHubUser, saveGitHubAccount, saveGitHubOAuthResult, saveGitHubToken } from "@/features/agent/components/githubConnection";

export default function GitHubCallbackPage() {
  const [message, setMessage] = useState("Connecting GitHub...");

  useEffect(() => {
    function publishOAuthResult(result: { type: typeof GITHUB_OAUTH_EVENT; token?: string; account?: string; error?: string }) {
      saveGitHubOAuthResult(result);
      window.opener?.postMessage(result, window.location.origin);
      new BroadcastChannel(GITHUB_OAUTH_EVENT).postMessage(result);
    }

    async function finishOAuth() {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const error = params.get("error");
      const token = params.get("token");

      if (error) {
        publishOAuthResult({ type: GITHUB_OAUTH_EVENT, error });
        setMessage(error);
        return;
      }

      if (!token) {
        const missingToken = "GitHub did not return an access token.";
        publishOAuthResult({ type: GITHUB_OAUTH_EVENT, error: missingToken });
        setMessage(missingToken);
        return;
      }

      saveGitHubToken(token);
      let account = "GitHub";
      try {
        account = await loadAuthenticatedGitHubUser(token) || account;
      } catch {
        account = "GitHub";
      }
      saveGitHubAccount(account);
      publishOAuthResult({ type: GITHUB_OAUTH_EVENT, token, account });
      setMessage(account ? `Connected as @${account}. You can close this window.` : "GitHub connected. You can close this window.");
      window.setTimeout(() => window.close(), 700);
    }

    void finishOAuth();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
