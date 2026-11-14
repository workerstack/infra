import { assertNotUnderTest } from "../assert-not-under-test.ts";
import { env } from "../env.ts";
import { discoverProducts } from "../products.ts";
import { repoRoot } from "../repo-root.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { CommandHost } from "./command-host.ts";

function stderrLog(line: string): void {
  process.stderr.write(`${line}\n`);
}

/** The host a command runs on outside a test: the process dir, the git root and the real streams. */
export function realHost(): CommandHost {
  return {
    cwd: process.cwd(),
    discover: discoverProducts,
    guard: () => {
      assertNotUnderTest(env);
    },
    root: repoRoot,
    stderr: stderrLog,
    stdout: stdoutLog,
  };
}
