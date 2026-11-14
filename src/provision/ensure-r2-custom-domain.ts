import type { CfClient } from "../api/client.ts";
import { R2_DOMAIN_ATTACHED } from "./r2-domain-attached.constants.ts";
import { R2_MIN_TLS } from "./r2-min-tls.constants.ts";

/** A custom domain for a bucket, in a zone. */
export type R2CustomDomain = { bucketName: string; domain: string; zoneId: string };

/** Attaches the domain to the bucket; "exists" when Cloudflare says it is already attached. */
export async function ensureR2CustomDomain(
  client: CfClient,
  accountId: string,
  target: R2CustomDomain,
): Promise<"attached" | "exists"> {
  const { bucketName, domain, zoneId } = target;

  try {
    await client.request("POST", `/accounts/${accountId}/r2/buckets/${bucketName}/domains/custom`, {
      domain,
      enabled: true,
      minTLS: R2_MIN_TLS,
      zoneId,
    });

    return "attached";
  } catch (error) {
    if (error instanceof Error && error.message.includes(R2_DOMAIN_ATTACHED)) return "exists";

    throw error;
  }
}
