import { mkdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { stringifyJson } from "../shared/jsonc.ts";
import { writeAtomic } from "../shared/write-atomic.ts";
import { DISPATCHER_COMPATIBILITY_DATE, DISPATCHER_DIR, DISPATCHER_NAME } from "./local.constants.ts";

// The dispatcher Worker beside this module, in its own extension: `.ts` from the source, `.js` from `dist`.
function dispatcherMain(): string {
  const here = fileURLToPath(import.meta.url);

  return join(dirname(here), `dispatcher.worker${extname(here)}`);
}

/**
 * The dispatcher's wrangler config under the product root, for the stack's Workers by name: one service binding
 * each, and `TARGETS` mapping each Worker's name to its binding. Rewritten on every start.
 */
export function writeDispatcher(productRoot: string, workers: readonly string[]): string {
  const services = workers.map((service, at) => ({ binding: `WORKER_${at}`, service }));
  const targets = Object.fromEntries(services.map(({ binding, service }) => [service, binding]));

  const config = {
    compatibility_date: DISPATCHER_COMPATIBILITY_DATE,
    main: dispatcherMain(),
    name: DISPATCHER_NAME,
    services,
    vars: { TARGETS: JSON.stringify(targets) },
  };

  const file = join(productRoot, DISPATCHER_DIR, "wrangler.json");

  mkdirSync(dirname(file), { recursive: true });
  writeAtomic(file, stringifyJson(config));

  return file;
}
