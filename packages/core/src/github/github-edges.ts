import type { CfFetch } from "../api/cf-fetch.ts";
import { env } from "../env.ts";
import { isUnderTest } from "../is-under-test.ts";
import { GITHUB_API } from "./github-api.constants.ts";
import type { GithubTarget } from "./github-target.ts";
import { GITHUB_WEB } from "./github-web.constants.ts";
import { MANIFEST_TIMEOUT_MS } from "./manifest-timeout-ms.constants.ts";
import { openUrl } from "./open-url.ts";

/** The edges the manifest flow goes through, with the target's swaps or the real ones. */
export type GithubEdges = {
  apiBase: string;
  canPrompt: boolean;
  fetcher: CfFetch;
  openUrl: (url: string) => void;
  timeoutMs: number;
  webBase: string;
};

/** The target's edges; it can prompt by default only in a terminal and outside a test runner. */
export function githubEdges(target: GithubTarget): GithubEdges {
  return {
    apiBase: target.apiBase ?? GITHUB_API,
    canPrompt: target.canPrompt ?? (process.stdin.isTTY && !isUnderTest(env)),
    fetcher: target.fetcher ?? fetch,
    openUrl: target.openUrl ?? openUrl,
    timeoutMs: target.timeoutMs ?? MANIFEST_TIMEOUT_MS,
    webBase: target.webBase ?? GITHUB_WEB,
  };
}
