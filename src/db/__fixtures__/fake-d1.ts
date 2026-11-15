import { readFileSync } from "node:fs";

import type { DbRun } from "../db-io.ts";
import type { DbCall } from "./fake-db-io.ts";

export type FakeD1 = {
  /** Where a `--file` run stops with exit 1; `undefined` lets it finish. Change it between runs. */
  fail: { after: number | undefined };
  /** The statements the SQL files run, in order, one entry per file. */
  files: string[][];
  /** Answers one program: a table listing for `--command`, the SQL's effect for `--file`. */
  onSpawn: (call: DbCall) => DbRun;
  /** The paths of the SQL files run, in order. */
  paths: string[];
  /** The live tables and their row counts. */
  tables: Map<string, number>;
};

const DROP = /^DROP TABLE IF EXISTS "(\w+)";$/;
const DELETE = /^DELETE FROM "(\w+)";$/;

/**
 * A D1 database over `tables` (names to row counts). A `--file` run applies its statements one by one; with
 * `failAfter` it stops there with exit 1, leaving the earlier statements applied, as a partial wipe does.
 */
export function fakeD1(tables: Record<string, number>, failAfter?: number): FakeD1 {
  const fail = { after: failAfter };
  const live = new Map(Object.entries(tables));
  const files: string[][] = [];
  const paths: string[] = [];

  function listing(): DbRun {
    const results = [...live.keys()].toSorted().map((name) => ({ name, sql: null, type: "table" }));

    return { code: 0, stderr: "", stdout: JSON.stringify([{ results }]) };
  }

  function apply(statement: string): void {
    const dropped = DROP.exec(statement)?.[1];
    const emptied = DELETE.exec(statement)?.[1];

    if (dropped !== undefined) live.delete(dropped);

    if (emptied !== undefined) live.set(emptied, 0);
  }

  function execute(file: string): DbRun {
    const statements = readFileSync(file, "utf8").split("\n");

    files.push(statements);
    paths.push(file);
    statements.slice(0, fail.after).forEach(apply);

    return fail.after !== undefined && fail.after < statements.length
      ? { code: 1, stderr: "D1 error: interrupted", stdout: "" }
      : { code: 0, stderr: "", stdout: "" };
  }

  return {
    fail,
    files,
    onSpawn: (call) => {
      const file = call.args.find((arg) => arg.startsWith("--file="));

      return file === undefined ? listing() : execute(file.slice("--file=".length));
    },
    paths,
    tables: live,
  };
}
