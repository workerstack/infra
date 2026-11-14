import type { CfClient } from "../api/client.ts";
import { READ_REPLICATION_AUTO } from "./read-replication-auto.constants.ts";

export type CfD1Detail = { name: string; num_tables: number; read_replication: { mode: string }; uuid: string };

function databasePath(accountId: string, databaseId: string): string {
  return `/accounts/${accountId}/d1/database/${databaseId}`;
}

/** A database's detail, or undefined when the request fails. */
export async function getD1Detail(
  client: CfClient,
  accountId: string,
  databaseId: string,
): Promise<CfD1Detail | undefined> {
  try {
    return await client.request<CfD1Detail>("GET", databasePath(accountId, databaseId));
  } catch {
    return undefined;
  }
}

/** Turns read replication on for a database. */
export async function enableD1ReadReplicas(client: CfClient, accountId: string, databaseId: string): Promise<void> {
  await client.request("PATCH", databasePath(accountId, databaseId), {
    read_replication: { mode: READ_REPLICATION_AUTO },
  });
}
