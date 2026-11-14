import type { CfClient } from "../api/client.ts";
import type { CfQueueResult } from "./find-or-create-queue.ts";
import { PAGE_SIZE } from "./page-size.constants.ts";

/** Whether a queue called `queueName` exists; a failed request counts as missing. */
export async function checkQueueExists(client: CfClient, accountId: string, queueName: string): Promise<boolean> {
  try {
    const queues = await client.request<CfQueueResult[]>("GET", `/accounts/${accountId}/queues?per_page=${PAGE_SIZE}`);

    return queues.some((queue) => queue.queue_name === queueName);
  } catch {
    return false;
  }
}
