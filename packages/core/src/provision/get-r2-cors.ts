import type { CfClient } from "../api/client.ts";
import type { R2CorsRule } from "../schema/bindings.ts";

/** A bucket's CORS rules, or none when the request fails. */
export async function getR2Cors(client: CfClient, accountId: string, bucketName: string): Promise<R2CorsRule[]> {
  try {
    const result = await client.request<{ rules: R2CorsRule[] }>(
      "GET",
      `/accounts/${accountId}/r2/buckets/${bucketName}/cors`,
    );

    return result.rules;
  } catch {
    return [];
  }
}
