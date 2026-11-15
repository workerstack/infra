import { randomBytes } from "node:crypto";

import { HTTP_STATUS } from "../http-status.constants.ts";
import type { GithubOAuthEnv } from "../schema/github.ts";
import { MS_PER_SECOND } from "../shared/ms-per-second.constants.ts";
import { githubManifest } from "./github-manifest.ts";
import { LOOPBACK_HOST } from "./loopback-host.constants.ts";
import { manifestFormUrl } from "./manifest-form-url.ts";
import { manifestPage } from "./manifest-page.ts";
import { MANIFEST_PATHS } from "./manifest-paths.constants.ts";
import { STATE_BYTES } from "./state-bytes.constants.ts";

/** One app's manifest flow: the scope's app, the browser opener and how long to wait. */
export type ManifestFlow = {
  oauth: GithubOAuthEnv;
  openUrl: (url: string) => void;
  timeoutMs: number;
  webBase: string;
};

type Waiting = { page: string; resolve: (code: string) => void; state: string };

const HTML = { "Content-Type": "text/html; charset=utf-8" };

function answer(request: Request, waiting: Waiting): Response {
  const url = new URL(request.url);

  if (url.pathname === MANIFEST_PATHS.page) return new Response(waiting.page, { headers: HTML });

  if (url.pathname !== MANIFEST_PATHS.callback) return new Response("not found", { status: HTTP_STATUS.NOT_FOUND });

  const code = url.searchParams.get("code") ?? "";

  if (url.searchParams.get("state") !== waiting.state || code === "")
    return new Response("This answer does not match the app infra asked for.", { status: HTTP_STATUS.BAD_REQUEST });

  waiting.resolve(code);

  return new Response("<p>The GitHub App is created. Return to the terminal.</p>", { headers: HTML });
}

/**
 * Serves a page on loopback that posts the manifest to GitHub, opens it, and returns the code GitHub redirects
 * back with once its `state` matches. The server closes after the callback or the timeout.
 */
export async function runManifestFlow(flow: ManifestFlow): Promise<string> {
  const { oauth, timeoutMs, webBase } = flow;
  const state = randomBytes(STATE_BYTES).toString("hex");
  const code = Promise.withResolvers<string>();
  const waiting: Waiting = { page: "", resolve: code.resolve, state };
  const server = Bun.serve({ fetch: (request) => answer(request, waiting), hostname: LOOPBACK_HOST, port: 0 });
  const origin = `http://${LOOPBACK_HOST}:${String(server.port)}/`;
  const manifest = githubManifest({ oauth, redirectUrl: `${origin}${MANIFEST_PATHS.callback.slice(1)}` });

  waiting.page = manifestPage({
    action: manifestFormUrl({ org: oauth.org, state, webBase }),
    manifest: JSON.stringify(manifest),
  });

  const seconds = Math.ceil(timeoutMs / MS_PER_SECOND);

  const timer = setTimeout(() => {
    code.reject(new Error(`no answer from GitHub within ${String(seconds)} s; run infra set again`));
  }, timeoutMs);

  try {
    flow.openUrl(origin);

    return await code.promise;
  } finally {
    clearTimeout(timer);
    await server.stop();
  }
}
