import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { fixtureConfig, fixtureEnv } from "./__fixtures__/kit-fixtures.ts";
import { ALLOCATE_RATELIMITS } from "./cf-kit.constants.ts";
import { readRegistry } from "./ratelimit-ids.ts";

const tmp = mkdtempSync(join(tmpdir(), "cf-kit-"));
const file = join(tmp, "ratelimit-ids.json");
const limit = { name: "RL_5", simple: { limit: 5, period: 60 } } as const;
const kit = fixtureConfig(fixtureEnv(), { ratelimitIds: file });

writeFileSync(file, JSON.stringify({ "acme-api": { dev: { RL_5: 1007 }, prod: { RL_5: 1017 } } }));

afterAll(() => rmSync(tmp, { force: true, recursive: true }));

describe("ratelimits", () => {
  it("take each namespace id from the registry", () => {
    expect(kit.ratelimits("acme-api", "prod", limit)).toStrictEqual({
      RL_5: { namespace: "1017", simple: { limit: 5, period: 60 }, type: "rate-limit" },
    });
  });

  it("fail naming the worker, scope and limiter when the registry has no id", () => {
    expect(() => kit.ratelimits("acme-api", "local", limit)).toThrow(
      "no rate-limit namespace id for acme-api/local/RL_5; run infra gen",
    );
  });

  it("fail the same way when the registry file does not exist", () => {
    const none = fixtureConfig(fixtureEnv(), { ratelimitIds: join(tmp, "missing.json") });

    expect(() => none.ratelimits("acme-api", "dev", limit)).toThrow("no rate-limit namespace id for acme-api/dev/RL_5");
  });
});

describe("ratelimit allocation", () => {
  it("is off unless infra gen turns it on, and then writes the next id into the registry", async () => {
    const next = { name: "RL_9", simple: { limit: 9, period: 60 } } as const;

    expect(() => kit.ratelimits("acme-api", "local", next)).toThrow("run infra gen");
    expect(readRegistry(file)["acme-api"]?.["local"]).toBeUndefined();

    const [first] = await kit[ALLOCATE_RATELIMITS](() =>
      Promise.resolve(Object.values(kit.ratelimits("acme-api", "local", next))),
    );

    expect(first).toMatchObject({ namespace: "1018", type: "rate-limit" });
    expect(readRegistry(file)["acme-api"]?.["local"]?.["RL_9"]).toBe(1018);
    expect(kit.ratelimits("acme-api", "local", next)).toStrictEqual({ RL_9: first });
    expect(() => kit.ratelimits("acme-api", "local", { ...next, name: "RL_10" })).toThrow("run infra gen");
  });
});
