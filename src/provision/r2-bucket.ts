import type { CfClient } from "../api/client.ts";
import type { R2BucketConfig, R2CorsRule } from "../schema/bindings.ts";
import { PAGE_SIZE } from "./page-size.constants.ts";

type CfR2Result = { name: string };

function bucketsPath(accountId: string): string {
  return `/accounts/${accountId}/r2/buckets`;
}

/** The R2 bucket called `name`, created when missing (with `locationHint` when given). */
export async function findOrCreateR2(
  client: CfClient,
  accountId: string,
  bucket: { locationHint?: R2BucketConfig["locationHint"]; name: string },
): Promise<CfR2Result> {
  const { locationHint, name } = bucket;
  const query = `name_contains=${encodeURIComponent(name)}&per_page=${PAGE_SIZE}`;
  const existing = await client.request<{ buckets: CfR2Result[] }>("GET", `${bucketsPath(accountId)}?${query}`);
  const match = existing.buckets.find((candidate) => candidate.name === name);

  if (match !== undefined) return match;

  await client.request("POST", bucketsPath(accountId), locationHint === undefined ? { name } : { locationHint, name });

  return { name };
}

/** Replaces a bucket's CORS rules. */
export async function setR2Cors(
  client: CfClient,
  accountId: string,
  cors: { bucketName: string; rules: R2CorsRule[] },
): Promise<void> {
  await client.request("PUT", `${bucketsPath(accountId)}/${cors.bucketName}/cors`, { rules: cors.rules });
}
