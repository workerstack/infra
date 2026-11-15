import { z } from "zod";

import { createAccountClient } from "../api/account-client.ts";
import type { CfFetch } from "../api/cf-fetch.ts";
import type { Json } from "../shared/json.ts";
import type { ScriptSettingsCall } from "./script-settings-call.ts";

/** The live `observability` of a script; with `call.observability` it PATCHes that first and returns the result. */
export async function scriptSettings(call: ScriptSettingsCall, fetcher: CfFetch): Promise<Json> {
  const client = createAccountClient(call.auth, call.accountId, fetcher);
  const path = `/workers/scripts/${call.script}/script-settings`;
  const patch = call.observability === undefined ? undefined : { observability: call.observability };
  const settings = z.looseObject({ observability: z.json().optional() });
  const result = settings.parse(await client.request(patch === undefined ? "GET" : "PATCH", path, patch));

  return result.observability ?? null;
}
