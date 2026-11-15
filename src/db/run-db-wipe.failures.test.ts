import { expect, it } from "vitest";

import { testHost } from "../command/__fixtures__/test-host.ts";
import { fakeD1 } from "./__fixtures__/fake-d1.ts";
import { fakeDbIo } from "./__fixtures__/fake-db-io.ts";
import { tempProducts } from "./__fixtures__/temp-products.ts";
import { runDbWipe } from "./run-db-wipe.ts";

const setup = tempProducts("CREATE TABLE users (id integer);\n");

it("names the bindings when --binding asks for one the product lacks, spawning nothing", async () => {
  const { calls, io } = fakeDbIo();
  const { err, host } = testHost([setup()]);

  expect(await runDbWipe(["--scope", "dev", "--binding", "NOPE"], host, io)).toBe(1);
  expect(err).toStrictEqual(["infra db-wipe: apps/web: Unknown binding NOPE. Available: DB"]);
  expect(calls).toStrictEqual([]);
});

it("marks a binding failed when listing its tables fails, with wrangler's message", async () => {
  const { io, out } = fakeDbIo({ onSpawn: () => ({ code: 1, stderr: "no such database", stdout: "" }) });
  const { host } = testHost([setup()]);

  expect(await runDbWipe(["--scope", "dev", "--binding=DB"], host, io)).toBe(1);
  expect(out.join("\n")).toContain("↳ no such database");
});

it("refuses a live table whose name is not an identifier, and runs no SQL", async () => {
  const d1 = fakeD1({ 'users"; DROP TABLE x; --': 1 });
  const { io, out } = fakeDbIo({ onSpawn: d1.onSpawn });
  const { host } = testHost([setup()]);

  expect(await runDbWipe(["--scope", "dev"], host, io)).toBe(1);
  expect(out.join("\n")).toContain("↳ Refusing non-identifier table name:");
  expect(d1.files).toStrictEqual([]);
});

it("prints the usage line and exits 2 without --scope, or for the local scope", async () => {
  const { events, io } = fakeDbIo();
  const { err, host } = testHost([setup()]);

  expect(await runDbWipe([], host, io)).toBe(2);
  expect(await runDbWipe(["--scope", "local"], host, io)).toBe(2);
  expect(err).toStrictEqual(
    Array(2).fill("usage: infra db-wipe [name|--all] --scope dev|prod [--binding NAME...] [--force] [--dry-run]"),
  );
  expect(events).toStrictEqual([]);
});
