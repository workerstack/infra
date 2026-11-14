import type { CfFetch } from "../api/cf-fetch.ts";
import { APPLE_JWKS_URL } from "./apple-jwks-url.constants.ts";

/** Whether Apple's JWKS endpoint answers with success. */
export async function isAppleJwksReachable(fetcher: CfFetch): Promise<boolean> {
  try {
    const response = await fetcher(APPLE_JWKS_URL, { method: "GET" });

    await response.body?.cancel();

    return response.ok;
  } catch {
    return false;
  }
}
