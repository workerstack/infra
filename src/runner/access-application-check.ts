import type { CloudflareAccessApplication } from "../schema/cloudflare-env.ts";

/** The app to verify and the Google IdP id it should allow, when the IdP exists. */
export type AccessApplicationCheck = { config: CloudflareAccessApplication; googleIdPId: string | undefined };
