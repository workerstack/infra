import { describe, expect, it } from "vitest";

import { fixtureConfig } from "./__fixtures__/kit-fixtures.ts";
import { createCfKit } from "./create-cf-kit.ts";

const kit = createCfKit({ config: fixtureConfig(), ratelimitIds: "r.json" });

describe("services and routes", () => {
  it("suffix each service target with the scope", () => {
    expect(kit.services("dev", { SAAS: "acme-saas" })).toStrictEqual({
      SAAS: { type: "worker", worker: "acme-saas-dev" },
    });
  });

  it("turn patterns into fetch triggers on a zone", () => {
    expect(kit.routes(["api.acme.ai", "api.acme.ai/*"], "acme.ai")).toStrictEqual([
      { pattern: "api.acme.ai", type: "fetch", zone: "acme.ai" },
      { pattern: "api.acme.ai/*", type: "fetch", zone: "acme.ai" },
    ]);
  });
});
