import { describe, expect, it } from "vitest";

import { placedOnZone } from "./placed-on-zone.ts";

const WHERE = {
  localHost: "gen.localhost",
  source: "/p/edge/cloudflare.config.ts",
  worker: "gen-edge",
  zone: "gen.ai",
};

describe("placedOnZone", () => {
  it("places a custom domain as its whole host and a route by its pattern, both on the kit's zone", () => {
    const routes = placedOnZone([{ custom_domain: true, pattern: "hooks.gen.ai" }, "gen.ai/edge*"], WHERE);

    expect(routes).toStrictEqual([
      { host: "hooks.gen.localhost", hostWildcard: false, path: "/", prefix: true, worker: "gen-edge" },
      { host: "gen.localhost", hostWildcard: false, path: "/edge", prefix: true, worker: "gen-edge" },
    ]);
  });

  it("refuses a route off the kit's zone, naming the config", () => {
    expect(() => placedOnZone(["hooks.other.dev"], WHERE)).toThrow(
      '/p/edge/cloudflare.config.ts: prod route "hooks.other.dev" is not on the kit\'s zone gen.ai',
    );
  });

  it("places no routes with no zone, and refuses any route", () => {
    expect(placedOnZone([], { ...WHERE, zone: undefined })).toStrictEqual([]);
    expect(() => placedOnZone(["gen.ai/*"], { ...WHERE, zone: undefined })).toThrow("has no cloudflare zone");
  });
});
