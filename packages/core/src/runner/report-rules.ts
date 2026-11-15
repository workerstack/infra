import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { ZoneRule } from "./zone-rule.ts";

/** Prints a ruleset phase's live rules, each as `[ON|OFF] description — action`, or `(none)`. */
export function reportRules(label: string, rules: ZoneRule[], log: Log = stdoutLog): void {
  if (rules.length === 0) {
    log(`  ${label}: (none)`);

    return;
  }

  log(`  ${label}:`);

  for (const rule of rules) log(`    [${rule.enabled ? "ON" : "OFF"}] ${rule.description} — ${rule.action}`);
}
