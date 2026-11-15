import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { z } from "zod";

import { appendArgs } from "../append-args.ts";
import { peerProgram } from "../peer-program.ts";
import type { InfraScope } from "../schema/infra.ts";
import { nodeChildEnv } from "./node-child-env.ts";

type Output = { stderr?: string | undefined; stdout?: string | undefined };

// What a failed run said: its stderr, else its stdout.
function saidText(output: Output): string | undefined {
  return [output.stderr, output.stdout].map((text) => text?.trim() ?? "").find((text) => text !== "");
}

/**
 * Types one Worker package: `cf workers types --mode <scope>` in its directory, through the `cf` peer's bin, which
 * writes `.cloudflare/types/index.d.ts`. What `infra gen` runs after writing a package.
 */
export async function cfTypes(dir: string, scope: InfraScope): Promise<void> {
  const program = appendArgs(peerProgram(dir, "cf", "cf"), ["workers", "types", "--mode", scope]);

  try {
    await promisify(execFile)(program.file, program.args, { cwd: dir, env: nodeChildEnv() });
  } catch (failure) {
    const output = z.object({ stderr: z.string().optional(), stdout: z.string().optional() }).safeParse(failure);
    const text = (output.success ? saidText(output.data) : undefined) ?? String(failure);

    throw new Error(`${dir}: cf workers types failed:\n${text}`, { cause: failure });
  }
}
