import type { CfClient } from "../api/client.ts";
import { buildScannerExpression } from "../presets/build-scanner-expression.ts";
import { SCANNER_PATHS } from "../presets/scanner-paths.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { RULESET_ACTION } from "./ruleset-action.constants.ts";
import { RULESET_PHASE } from "./ruleset-phase.constants.ts";
import { upsertRuleset } from "./upsert-ruleset.ts";

const SCANNER_DESCRIPTION = "Block vulnerability scanners";

function scannerPaths(scannerBlock: true | { extra: string[] }): readonly string[] {
  return scannerBlock === true ? SCANNER_PATHS : [...SCANNER_PATHS, ...scannerBlock.extra];
}

/** Writes the firewall phase: the scanner block rule, then the config's own rules; nothing when there are none. */
export async function setWafRules(client: CfClient, config: ZoneConfig): Promise<void> {
  const { rules, scannerBlock } = config.waf;
  const wanted: object[] = [];

  if (scannerBlock !== false) {
    wanted.push({
      action: RULESET_ACTION.BLOCK,
      description: SCANNER_DESCRIPTION,
      enabled: true,
      expression: buildScannerExpression(scannerPaths(scannerBlock)),
    });
  }

  for (const rule of rules) {
    wanted.push({
      action: rule.action,
      description: rule.description,
      enabled: rule.enabled,
      expression: rule.expression,
    });
  }

  if (wanted.length > 0) await upsertRuleset(client, RULESET_PHASE.FIREWALL_CUSTOM, wanted);
}
