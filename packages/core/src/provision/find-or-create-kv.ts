import type { CfClient } from "../api/client.ts";
import { PAGE_SIZE } from "./page-size.constants.ts";

export type CfKvResult = { id: string; title: string };

/** The KV namespace titled `title`, created when missing. */
export async function findOrCreateKV(client: CfClient, accountId: string, title: string): Promise<CfKvResult> {
  const path = `/accounts/${accountId}/storage/kv/namespaces`;
  const existing = await client.request<CfKvResult[]>("GET", `${path}?per_page=${PAGE_SIZE}`);

  return existing.find((namespace) => namespace.title === title) ?? client.request<CfKvResult>("POST", path, { title });
}
