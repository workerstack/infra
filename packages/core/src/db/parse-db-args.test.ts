import { expect, it } from "vitest";

import { parseDbArgs } from "./parse-db-args.ts";

const WIPE = { allowed: ["binding", "dry-run", "force", "scope"] };

it("defaults the scope when the command has a default, and reads --scope in both forms", () => {
  expect(parseDbArgs([], { allowed: ["scope"], defaultScope: "prod" })?.scope).toBe("prod");
  expect(parseDbArgs(["web", "--scope", "dev"], { allowed: ["scope"], defaultScope: "prod" })).toMatchObject({
    positionals: ["web"],
    scope: "dev",
  });
  expect(parseDbArgs(["--scope=dev", "--all"], WIPE)).toMatchObject({ positionals: ["--all"], scope: "dev" });
});

it("refuses the local scope, a missing required scope, unknown flags and flags the command lacks", () => {
  expect(parseDbArgs(["--scope", "local"], WIPE)).toBeUndefined();
  expect(parseDbArgs([], WIPE)).toBeUndefined();
  expect(parseDbArgs(["--scope"], WIPE)).toBeUndefined();
  expect(parseDbArgs(["--scope", "dev", "--nope"], WIPE)).toBeUndefined();
  expect(parseDbArgs(["--scope", "dev", "--force"], { allowed: ["scope"] })).toBeUndefined();
});

it("reads repeated --binding values, --force and --dry-run", () => {
  expect(parseDbArgs(["--scope", "dev", "--binding", "A", "--binding=B", "--force", "--dry-run"], WIPE)).toStrictEqual({
    bindings: ["A", "B"],
    dryRun: true,
    force: true,
    positionals: [],
    scope: "dev",
  });
});
