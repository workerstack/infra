import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { allocateRatelimitId, type RatelimitRegistry, readRegistry } from "./ratelimit-ids.ts";

const roots: string[] = [];

function registryFile(registry?: RatelimitRegistry): string {
  const root = mkdtempSync(join(tmpdir(), "ratelimit-ids-"));
  const file = join(root, "ratelimit-ids.json");

  roots.push(root);

  if (registry !== undefined) writeFileSync(file, JSON.stringify(registry));

  return file;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe("allocateRatelimitId", () => {
  it("writes the next id above every id in the registry and keeps the ids already given", () => {
    const file = registryFile({ "acme-api": { prod: { RL_5: 1001 } } });

    expect(allocateRatelimitId({ file, name: "RL_5", scope: "dev", worker: "acme-api" })).toBe(1002);
    expect(allocateRatelimitId({ file, name: "RL_5", scope: "prod", worker: "acme-q" })).toBe(1003);
    expect(readRegistry(file)).toStrictEqual({
      "acme-api": { dev: { RL_5: 1002 }, prod: { RL_5: 1001 } },
      "acme-q": { prod: { RL_5: 1003 } },
    });
  });

  it("answers a limiter that has an id with that id, whatever the registry holds above it", () => {
    const file = registryFile({ "acme-api": { prod: { RL_5: 1001, RL_6: 3005 } } });

    expect(allocateRatelimitId({ file, name: "RL_5", scope: "prod", worker: "acme-api" })).toBe(1001);
    expect(readRegistry(file)).toStrictEqual({ "acme-api": { prod: { RL_5: 1001, RL_6: 3005 } } });
  });

  it("starts at 1 for a missing registry", () => {
    const file = registryFile();

    expect(allocateRatelimitId({ file, name: "RL", scope: "dev", worker: "w" })).toBe(1);
    expect(readRegistry(file)).toStrictEqual({ w: { dev: { RL: 1 } } });
  });
});

describe("the registry file", () => {
  it("is written with its keys sorted at every level, as the JSON gate wants it", () => {
    const file = registryFile();

    allocateRatelimitId({ file, name: "RL_B", scope: "prod", worker: "b-api" });
    allocateRatelimitId({ file, name: "RL_A", scope: "prod", worker: "a-api" });
    allocateRatelimitId({ file, name: "RL_A", scope: "dev", worker: "a-api" });
    const registry = readRegistry(file);

    expect(Object.keys(registry)).toStrictEqual(["a-api", "b-api"]);
    expect(Object.keys(registry["a-api"] ?? {})).toStrictEqual(["dev", "prod"]);
  });
});
