import type { CfClient } from "../api/client.ts";
import { getSettingRaw } from "./get-setting-raw.ts";

/** A scalar zone setting's value. */
export async function getSetting(client: CfClient, name: string): Promise<string> {
  return await getSettingRaw<string>(client, name);
}
