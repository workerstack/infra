import type { EnvBindings } from "../schema/bindings.ts";
import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";

function line(binding: string, fields: string): string {
  return `    { "binding": "${binding}", ${fields} }`;
}

function resourceLines(bindings: EnvBindings): string[] {
  const d1 = Object.entries(bindings.d1_databases ?? {}).map(([binding, value]) =>
    line(binding, `"database_id": "${value.database_id}", "database_name": "${value.database_name}"`),
  );

  const kv = Object.entries(bindings.kv_namespaces ?? {}).map(([binding, value]) =>
    line(binding, `"id": "${value.id}"`),
  );

  const r2 = Object.entries(bindings.r2_buckets ?? {}).map(([binding, value]) =>
    line(binding, `"bucket_name": "${value.bucket_name}"`),
  );

  return [...d1, ...kv, ...r2];
}

function streamLines(bindings: EnvBindings): string[] {
  const analytics = Object.entries(bindings.analytics_engine_datasets ?? {}).map(([binding, value]) =>
    line(binding, `"dataset": "${value.dataset}"`),
  );

  const queues = Object.entries(bindings.queues ?? {}).map(([binding, value]) =>
    line(binding, `"queue": "${value.queue}"`),
  );

  return [...analytics, ...queues];
}

/** Prints one env's declared bindings as wrangler-style JSON lines. */
export function reportDeclaredBindings(env: string, bindings: EnvBindings, log: Log = stdoutLog): void {
  log(`  Bindings [${env}]:`);

  for (const text of [...resourceLines(bindings), ...streamLines(bindings)]) log(text);
}
