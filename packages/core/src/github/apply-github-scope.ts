import { clientIdEdit } from "../microsoft/client-id-edit.ts";
import type { Provisioned } from "../provision/provisioned.ts";
import type { GithubOAuthEnv } from "../schema/github.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";
import { maskSecret } from "../shared/mask-secret.ts";
import { STUB } from "../shared/stub.constants.ts";
import { convertManifestCode } from "./convert-manifest-code.ts";
import type { GithubEdges } from "./github-edges.ts";
import { runManifestFlow } from "./manifest-flow.ts";

/** What one scope's app needs to be created and where the results go. */
export type GithubScopeRun = {
  edges: GithubEdges;
  hasSecret: boolean;
  log: Log;
  oauth: GithubOAuthEnv;
  out: Provisioned;
  scope: InfraScope;
};

function reportProvisioned(run: GithubScopeRun): void {
  const { hasSecret, log, oauth, scope } = run;

  log(`    [${scope}] "${oauth.appName}" ✓ ${oauth.clientId}`);

  if (hasSecret) return;

  log(
    "    → no GITHUB_CLIENT_SECRET: generate one in the app's settings, then run " +
      `bun repo env set GITHUB_CLIENT_SECRET --scope ${scope}`,
  );
}

/** Creates a STUB scope's app by the manifest flow; its id becomes an edit, its secret a write. */
export async function applyGithubScope(run: GithubScopeRun): Promise<void> {
  const { edges, log, oauth, out, scope } = run;

  if (oauth.clientId !== STUB) return reportProvisioned(run);

  if (!edges.canPrompt)
    throw new Error(`github.oauth.${scope} has clientId "STUB" and needs the browser; run infra set in a terminal`);

  log(`    [${scope}] "${oauth.appName}" ...`);

  function openUrl(url: string): void {
    log(`    → create the app in the browser: ${url}`);
    edges.openUrl(url);
  }

  const code = await runManifestFlow({ oauth, openUrl, timeoutMs: edges.timeoutMs, webBase: edges.webBase });
  const app = await convertManifestCode({ apiBase: edges.apiBase, code, fetcher: edges.fetcher });

  log(`    → clientId: ${app.clientId}`);
  log(`    → secret: ${maskSecret(app.clientSecret)}`);
  log("    → no private key stored: sign-in needs only the client id and secret");
  out.edits.push(clientIdEdit(oauth.appName, app.clientId));
  out.secrets.push({ key: "GITHUB_CLIENT_SECRET", scope, value: app.clientSecret });
}
