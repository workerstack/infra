import type { CfClient } from "../api/client.ts";
import type { SettingValue } from "./setting-value.ts";

/**
 * CF setting values are usually scalar strings ("on", "off", "1.2"), but a few endpoints
 * (notably `security_header`) take a structured object.
 */
export async function patchSetting(client: CfClient, name: string, value: SettingValue): Promise<void> {
  await client.request("PATCH", `/zones/${client.zoneId}/settings/${name}`, { value });
}
