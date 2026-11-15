import { assertNotUnderTest } from "../assert-not-under-test.ts";
import { env } from "../env.ts";
import { repoRoot } from "../repo-root.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { loadWorkers } from "../workers/load-workers.ts";
import type { LogsHost } from "./logs-host.ts";

function stderrLog(line: string): void {
  process.stderr.write(`${line}\n`);
}

function onStop(stop: () => void): () => void {
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  return () => {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  };
}

/** The host a logs command runs on outside a test: the process dir, the git root, real signals and streams. */
export function realLogsHost(): LogsHost {
  return {
    cwd: process.cwd(),
    guard: () => {
      assertNotUnderTest(env);
    },
    load: loadWorkers,
    onStop,
    root: repoRoot,
    stderr: stderrLog,
    stdout: stdoutLog,
  };
}
