import type { CfFetch } from "../api/cf-fetch.ts";
import { GITHUB_ACCEPT } from "./github-accept.constants.ts";

/** The public fields of a GitHub App that `infra get` checks. */
export type GithubApp = { client_id?: string };

/** The app with this slug, or undefined when GitHub has none or fails; no auth. */
export async function getGithubApp(call: {
  apiBase: string;
  fetcher: CfFetch;
  slug: string;
}): Promise<GithubApp | undefined> {
  try {
    const url = `${call.apiBase}/apps/${encodeURIComponent(call.slug)}`;
    const response = await call.fetcher(url, { headers: { Accept: GITHUB_ACCEPT }, method: "GET" });

    if (!response.ok) return undefined;

    return (await response.json()) /* the app GitHub documents */ as GithubApp;
  } catch {
    return undefined;
  }
}
