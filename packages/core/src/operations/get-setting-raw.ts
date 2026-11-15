import type { CfClient } from "../api/client.ts";
import type { CfSetting } from "./cf-setting.ts";

/** A zone setting's value, in the shape `T` the caller names for that setting. */
export async function getSettingRaw<T>(client: CfClient, name: string): Promise<T> {
  const result = await client.request<CfSetting<T>>("GET", `/zones/${client.zoneId}/settings/${name}`);

  return result.value;
}
