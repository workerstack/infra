import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { BindingEnvVerification } from "./binding-env-verification.ts";

/** Prints each env's verified bindings: type, name and `✓` or `✗ MISSING`, with replicas and any note. */
export function reportBindings(results: BindingEnvVerification[], log: Log = stdoutLog): void {
  log("  Bindings (verified):");

  for (const result of results) {
    log(`    [${result.env}]:`);

    for (const binding of result.bindings) {
      const status = binding.exists ? "✓" : "✗ MISSING";
      const replicas = binding.readReplicas === undefined ? "" : ` [replicas: ${binding.readReplicas}]`;
      const note = binding.note === undefined ? "" : ` (${binding.note})`;

      log(`      ${binding.type} ${binding.binding} (${binding.name}) ${status}${replicas}${note}`);
    }
  }
}
