import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { CONTENT_CONVERTER_DENIED } from "./content-converter-denied.constants.ts";
import { CONTENT_CONVERTER_SKIPPED } from "./content-converter-skipped.constants.ts";
import { patchSetting } from "./patch-setting.ts";
import { SETTING_TOGGLE } from "./setting-toggle.constants.ts";
import { ZONE_SETTING } from "./zone-setting.constants.ts";

// Agent-readiness zone settings make a site discoverable and consumable by AI agents. Today that is
// `content_converter` (Markdown for Agents). Rules-level work (Link headers, /.well-known files) stays in the
// Worker: only zone settings belong here.
/** Patches `content_converter`; a plan that may not edit it is skipped with a progress line, not an error. */
export async function setAgentReadinessSettings(
  client: CfClient,
  config: ZoneConfig,
  log: Log = stdoutLog,
): Promise<void> {
  const value = config.agentReadiness.markdownForAgents ? SETTING_TOGGLE.ON : SETTING_TOGGLE.OFF;

  try {
    await patchSetting(client, ZONE_SETTING.CONTENT_CONVERTER, value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(CONTENT_CONVERTER_DENIED)) throw error;

    log(CONTENT_CONVERTER_SKIPPED);
  }
}
