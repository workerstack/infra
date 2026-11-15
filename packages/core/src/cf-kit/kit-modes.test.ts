import { describe, expect, it } from "vitest";

import { fixtureConfig, fixtureEnv } from "./__fixtures__/kit-fixtures.ts";

const defaults = { compatibilityDate: "2026-01-20", compatibilityFlags: ["nodejs_compat"] };
const kit = fixtureConfig(fixtureEnv(), { defaults });

describe("env and name", () => {
  it("accepts the three scopes and suffixes a Worker's name with the scope", () => {
    expect(kit.scope("prod")).toBe("prod");
    expect(kit.scope("local")).toBe("local");
    expect(kit.name("acme-api", kit.scope("dev"))).toBe("acme-api-dev");
  });

  it("reads Vite's default dev mode, `development`, as local", () => {
    expect(kit.scope("development")).toBe("local");
  });

  it("fails on a mode that is no scope, listing the scopes", () => {
    expect(() => kit.scope("staging")).toThrow('mode "staging" is not one of local, dev, prod');
    expect(() => kit.scope(undefined)).toThrow("no mode: pass --mode local, dev or prod");
  });
});

describe("what a gen run reads", () => {
  it("lists the scopes and hands out the shared defaults", () => {
    expect(kit.envs).toStrictEqual(["local", "dev", "prod"]);
    expect(kit.defaults).toStrictEqual(defaults);
    expect(fixtureConfig().defaults).toStrictEqual({});
  });
});
