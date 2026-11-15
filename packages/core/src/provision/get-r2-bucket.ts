import type { CfClient } from "../api/client.ts";

export type CfR2BucketDetail = { location: string; name: string };

/** A bucket's detail, or undefined when the request fails. */
export async function getR2Bucket(
  client: CfClient,
  accountId: string,
  name: string,
): Promise<CfR2BucketDetail | undefined> {
  try {
    return await client.request<CfR2BucketDetail>("GET", `/accounts/${accountId}/r2/buckets/${name}`);
  } catch {
    return undefined;
  }
}
