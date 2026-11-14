import type { CfClient } from "../api/client.ts";
import { PAGE_SIZE } from "./page-size.constants.ts";

export type CfQueueResult = { queue_id: string; queue_name: string };

/** The queue called `queueName`, created when missing. */
export async function findOrCreateQueue(
  client: CfClient,
  accountId: string,
  queueName: string,
): Promise<CfQueueResult> {
  const path = `/accounts/${accountId}/queues`;
  const existing = await client.request<CfQueueResult[]>("GET", `${path}?per_page=${PAGE_SIZE}`);

  return (
    existing.find((queue) => queue.queue_name === queueName) ??
    client.request<CfQueueResult>("POST", path, { queue_name: queueName })
  );
}
