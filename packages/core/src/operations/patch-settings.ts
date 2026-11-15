import type { CfClient } from "../api/client.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { patchSetting } from "./patch-setting.ts";

/** Patches each `[name, value]` entry, one request after the other, in order. */
export async function patchSettings(
  client: CfClient,
  entries: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  await runInOrder([...entries], ([name, value]) => patchSetting(client, name, value));
}
