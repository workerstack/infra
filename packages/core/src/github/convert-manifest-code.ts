import type { CfFetch } from "../api/cf-fetch.ts";
import { HTTP_STATUS } from "../http-status.constants.ts";
import { GITHUB_ACCEPT } from "./github-accept.constants.ts";

/** What infra keeps of a converted manifest: the client id and secret; the private key and webhook secret drop. */
export type ConvertedApp = { clientId: string; clientSecret: string; slug: string };

type Conversion = { client_id: string; client_secret: string; slug: string };

/** Trades the one-hour manifest code for the new app's credentials; a refusal throws the request line. */
export async function convertManifestCode(call: {
  apiBase: string;
  code: string;
  fetcher: CfFetch;
}): Promise<ConvertedApp> {
  const url = `${call.apiBase}/app-manifests/${encodeURIComponent(call.code)}/conversions`;
  const response = await call.fetcher(url, { headers: { Accept: GITHUB_ACCEPT }, method: "POST" });

  if (response.status !== HTTP_STATUS.CREATED)
    throw new Error(`GitHub API POST /app-manifests/<code>/conversions: ${String(response.status)}`);

  const body = (await response.json()) /* the conversion GitHub documents */ as Conversion;

  return { clientId: body.client_id, clientSecret: body.client_secret, slug: body.slug };
}
