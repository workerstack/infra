import type { CfClient } from "../api/client.ts";
import { D1_PAGE_SIZE } from "./d1-page-size.constants.ts";
import type { CfD1Result } from "./find-or-create-d1.ts";

/** Whether a D1 database called `name` exists, and its uuid; a failed request counts as missing. */
export async function checkD1Exists(
  client: CfClient,
  accountId: string,
  name: string,
): Promise<{ exists: boolean; uuid?: string }> {
  try {
    const path = `/accounts/${accountId}/d1/database?name=${encodeURIComponent(name)}&per_page=${D1_PAGE_SIZE}`;
    const databases = await client.request<CfD1Result[]>("GET", path);
    const match = databases.find((database) => database.name === name);

    return match === undefined ? { exists: false } : { exists: true, uuid: match.uuid };
  } catch {
    return { exists: false };
  }
}
