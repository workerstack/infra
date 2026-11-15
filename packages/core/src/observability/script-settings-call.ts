import type { CfAuth } from "../api/auth.ts";
import type { Json } from "../shared/json.ts";

/** One `script-settings` request: a read, or with `observability` a PATCH of it. */
export type ScriptSettingsCall = {
  accountId: string;
  auth: CfAuth;
  observability?: Json;
  script: string;
};
