import type { CfClient } from "../api/client.ts";
import { D1_PAGE_SIZE } from "./d1-page-size.constants.ts";

export type CfD1Result = { name: string; uuid: string };

/** The D1 database called `name`, created when missing. */
export async function findOrCreateD1(client: CfClient, accountId: string, name: string): Promise<CfD1Result> {
  const path = `/accounts/${accountId}/d1/database`;

  const existing = await client.request<CfD1Result[]>(
    "GET",
    `${path}?name=${encodeURIComponent(name)}&per_page=${D1_PAGE_SIZE}`,
  );

  return existing.find((database) => database.name === name) ?? client.request<CfD1Result>("POST", path, { name });
}
