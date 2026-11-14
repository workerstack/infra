import type { CfClient } from "../api/client.ts";
import { getR2Bucket } from "../provision/get-r2-bucket.ts";
import { getR2Cors } from "../provision/get-r2-cors.ts";
import { getR2CustomDomain } from "../provision/get-r2-custom-domain.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { R2BucketVerification } from "./r2-bucket-verification.ts";

type R2Binding = NonNullable<EnvBindings["r2_buckets"]>[string];

/** A binding to verify: its name and the bucket config. */
export type R2BucketTarget = { binding: string; config: R2Binding; bucketName: string };

async function readCustomDomains(
  client: CfClient,
  accountId: string,
  target: R2BucketTarget,
): Promise<R2BucketVerification["customDomains"]> {
  const domains: R2BucketVerification["customDomains"] = [];

  await runInOrder(target.config.customDomains ?? [], async (domain) => {
    const detail = await getR2CustomDomain(client, accountId, { bucketName: target.bucketName, domain });

    if (detail === undefined) {
      domains.push({ domain, enabled: false, ownership: "missing", ssl: "missing" });

      return;
    }

    const { ownership, ssl } = detail.status;

    domains.push({ domain: detail.domain, enabled: detail.enabled, ownership, ssl });
  });

  return domains;
}

/** Reads one bucket's location, CORS rules and custom domains and compares the location with its hint. */
export async function verifyR2Bucket(
  client: CfClient,
  accountId: string,
  target: R2BucketTarget,
): Promise<R2BucketVerification> {
  const { binding, bucketName, config } = target;

  const [bucket, cors] = await Promise.all([
    getR2Bucket(client, accountId, bucketName),
    getR2Cors(client, accountId, bucketName),
  ]);

  const customDomains = await readCustomDomains(client, accountId, target);

  const locationHint = config.locationHint;

  // Cloudflare returns the location uppercase (such as "ENAM"); the config hint is lowercase.
  const locationMatches = locationHint === undefined || bucket?.location.toLowerCase() === locationHint.toLowerCase();

  return { binding, bucketName, cors, customDomains, location: bucket?.location, locationHint, locationMatches };
}
