import type { CfClient } from "../api/client.ts";

/** GETs a list endpoint and returns its items, whether CF sent an array or `{ result }`. */
export async function accessList<T>(client: CfClient, path: string): Promise<T[]> {
  const listResult = await client.request<{ result: T[] } | T[]>("GET", path);

  return Array.isArray(listResult) ? listResult : listResult.result;
}
