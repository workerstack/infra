import { parseArgs } from "node:util";

import type { TailOptions } from "./tail-options.ts";
import { TAIL_DEFAULT_MINUTES } from "./tail.constants.ts";

/** The raw options of `infra logs-tail`; an unknown flag throws. */
export function parseTailOptions(argv: readonly string[]): TailOptions {
  return parseArgs({
    allowPositionals: true,
    args: [...argv],
    options: {
      header: { multiple: true, type: "string" },
      help: { short: "h", type: "boolean" },
      ip: { multiple: true, type: "string" },
      method: { multiple: true, type: "string" },
      minutes: { default: String(TAIL_DEFAULT_MINUTES), type: "string" },
      "sampling-rate": { multiple: true, type: "string" },
      scope: { default: "prod", type: "string" },
      search: { multiple: true, type: "string" },
      status: { multiple: true, type: "string" },
    },
    strict: true,
  });
}
