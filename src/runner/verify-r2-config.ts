import type { CfClient } from "../api/client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { R2BucketVerification } from "./r2-bucket-verification.ts";
import type { R2EnvVerification } from "./r2-env-verification.ts";
import { verifyR2Bucket } from "./verify-r2-bucket.ts";

async function verifyEnvBuckets(
  client: CfClient,
  accountId: string,
  envBindings: EnvBindings,
): Promise<R2BucketVerification[]> {
  const buckets: R2BucketVerification[] = [];

  await runInOrder(Object.entries(envBindings.r2_buckets ?? {}), async ([binding, config]) => {
    const bucketName = config.bucket_name;

    if (bucketName === undefined || bucketName === "") return;

    buckets.push(await verifyR2Bucket(client, accountId, { binding, bucketName, config }));
  });

  return buckets;
}

/** Verifies every declared R2 bucket of every env; an env with no bucket is left out. */
export async function verifyR2Config(
  client: CfClient,
  accountId: string,
  bindings: Record<string, EnvBindings>,
): Promise<R2EnvVerification[]> {
  const results: R2EnvVerification[] = [];

  await runInOrder(Object.entries(bindings), async ([env, envBindings]) => {
    const buckets = await verifyEnvBuckets(client, accountId, envBindings);

    if (buckets.length > 0) results.push({ buckets, env });
  });

  return results;
}
