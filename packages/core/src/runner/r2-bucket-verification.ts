import type { R2CorsRule } from "../schema/bindings.ts";

/** One R2 bucket as the verify read it. */
export type R2BucketVerification = {
  binding: string;
  bucketName: string;
  cors: R2CorsRule[];
  customDomains: Array<{ domain: string; enabled: boolean; ownership: string; ssl: string }>;
  /** The bucket's location as Cloudflare reports it. */
  location: string | undefined;
  /** Config-declared location hint, if any. */
  locationHint?: string | undefined;
  /**
   * True when config has no `locationHint` (no expectation), or when Cloudflare's reported location matches.
   * Cloudflare may map hints to wider regions, so a mismatch is not necessarily drift: inspect it when false.
   */
  locationMatches: boolean;
};
