import { describe, expect, it } from "vitest";

import { fixtureConfig } from "./__fixtures__/kit-fixtures.ts";
import { createCfKit } from "./create-cf-kit.ts";

const defaults = { compatibilityDate: "2026-01-20", compatibilityFlags: ["nodejs_compat"] };
const kit = createCfKit({ config: fixtureConfig(), defaults, ratelimitIds: "r.json" });

describe("env and name", () => {
  it("accepts the three scopes and suffixes a Worker's name with the scope", () => {
    expect(kit.env("prod")).toBe("prod");
    expect(kit.env("local")).toBe("local");
    expect(kit.name("acme-api", kit.env("dev"))).toBe("acme-api-dev");
  });

  it("reads Vite's default dev mode, `development`, as local", () => {
    expect(kit.env("development")).toBe("local");
  });

  it("fails on a mode that is no scope, listing the scopes", () => {
    expect(() => kit.env("staging")).toThrow('mode "staging" is not one of local, dev, prod');
    expect(() => kit.env(undefined)).toThrow("no mode: pass --mode local, dev or prod");
  });
});

describe("what a gen run reads", () => {
  it("lists the scopes and hands out the shared defaults", () => {
    expect(kit.envs).toStrictEqual(["local", "dev", "prod"]);
    expect(kit.defaults).toStrictEqual(defaults);
    expect(createCfKit({ config: fixtureConfig(), ratelimitIds: "r.json" }).defaults).toStrictEqual({});
  });
});
