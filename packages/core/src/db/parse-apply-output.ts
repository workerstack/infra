import { z } from "zod";

import { firstText } from "./first-text.ts";

/** One database's apply, read from `database migrate apply --json`. */
export type ParsedApplyOutput = { error?: string; migrationsApplied: number; status: "applied" | "failed" | "noop" };

function resultOf(stdout: string): { applied: string[]; refused: string[] } | undefined {
  try {
    const last = stdout.trim().split("\n").pop() ?? "";
    const result = z.object({ applied: z.array(z.string()), refused: z.array(z.string()) }).safeParse(JSON.parse(last));

    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

/**
 * What the apply did, from the one JSON object `database` printed last on stdout: what it applied, or why it failed.
 * A run whose stdout holds no result is a failure, never a silent "applied 0".
 */
export function parseApplyOutput(stdout: string, stderr: string, code: number): ParsedApplyOutput {
  const result = resultOf(stdout);

  if (code !== 0) {
    const error = firstText([result?.refused.join("; ") ?? "", stderr], "unknown failure");

    return { error, migrationsApplied: 0, status: "failed" };
  }

  if (result === undefined)
    return { error: "database printed no --json result", migrationsApplied: 0, status: "failed" };

  return result.applied.length === 0
    ? { migrationsApplied: 0, status: "noop" }
    : { migrationsApplied: result.applied.length, status: "applied" };
}
