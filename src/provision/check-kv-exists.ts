import type { CfClient } from "../api/client.ts";

/** Whether the KV namespace `id` exists; a failed request counts as missing. */
export async function checkKVExists(client: CfClient, accountId: string, id: string): Promise<boolean> {
  try {
    await client.request("GET", `/accounts/${accountId}/storage/kv/namespaces/${id}`);

    return true;
  } catch {
    return false;
  }
}
