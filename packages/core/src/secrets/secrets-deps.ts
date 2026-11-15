import type { Log } from "../shared/log.ts";
import type { EnvSetCall } from "./env-set-call.ts";

/** The edges `writeSecrets` reaches through: the process spawn (its exit code) and the progress log. */
export type SecretsDeps = { log: Log; spawn: (call: EnvSetCall) => Promise<number> };
