import { describe, expect, it } from "vitest";

import { localRoutes } from "./local-routes.ts";
import { matchRoute } from "./match-route.ts";

function zone(...patterns: string[]) {
  return patterns.map((pattern) => ({ pattern, zone_name: "acme.ai" }));
}

const ROUTES = [
  ...localRoutes(zone("acme.ai/*", "acme.ai"), "acme.localhost", "site"),
  ...localRoutes(zone("api.acme.ai", "api.acme.ai/*", "acme.ai/api", "acme.ai/api/*"), "acme.localhost", "api"),
  ...localRoutes(zone("acme.ai/app*"), "acme.localhost", "app"),
  ...localRoutes(zone("*.acme.ai/*"), "acme.localhost", "tenants"),
  ...localRoutes(zone("cdn.acme.ai/v1/health"), "acme.localhost", "cdn"),
];

function worker(host: string, path: string): string | undefined {
  return matchRoute(ROUTES, host, path)?.worker;
}

describe("localRoutes", () => {
  it("moves each pattern from its zone to the local host, keeping the path", () => {
    expect(localRoutes(zone("acme.ai", "api.acme.ai/*", "acme.ai/app*"), "acme.localhost", "w")).toStrictEqual([
      { host: "acme.localhost", hostWildcard: false, path: "/", prefix: false, worker: "w" },
      { host: "api.acme.localhost", hostWildcard: false, path: "/", prefix: true, worker: "w" },
      { host: "acme.localhost", hostWildcard: false, path: "/app", prefix: true, worker: "w" },
    ]);
  });

  it("fails a pattern outside its zone", () => {
    expect(() => localRoutes([{ pattern: "other.io/*", zone_name: "acme.ai" }], "acme.localhost", "w")).toThrow(
      "w: route other.io/* is not on its zone acme.ai",
    );
  });
});

describe("matchRoute", () => {
  it("picks the longer path over a shorter one on the same host", () => {
    expect(worker("acme.localhost", "/pricing")).toBe("site");
    expect(worker("acme.localhost", "/api")).toBe("api");
    expect(worker("acme.localhost", "/api/v1/tiers")).toBe("api");
    expect(worker("acme.localhost", "/apix")).toBe("site");
    expect(worker("acme.localhost", "/app/settings")).toBe("app");
  });

  it("matches a pattern with no path on / alone", () => {
    expect(worker("acme.localhost", "/")).toBe("site");
    expect(worker("cdn.acme.localhost", "/v1/health")).toBe("cdn");
    expect(worker("cdn.acme.localhost", "/v1/health/x")).toBe("tenants");
  });

  it("picks an exact host over a wildcard host, and the host itself only for a host wildcard", () => {
    expect(worker("api.acme.localhost", "/v1/tiers")).toBe("api");
    expect(worker("eu.acme.localhost", "/x")).toBe("tenants");

    const both = localRoutes([{ pattern: "*acme.ai/*", zone_name: "acme.ai" }], "acme.localhost", "all");

    expect(matchRoute(both, "acme.localhost", "/x")?.worker).toBe("all");
    expect(matchRoute(both, "eu.acme.localhost", "/x")?.worker).toBe("all");
  });

  it("ignores the port in the Host", () => {
    expect(worker("acme.localhost:8123", "/api/v1")).toBe("api");
    expect(worker("api.acme.localhost:8123", "/")).toBe("api");
  });

  it("matches nothing on another host or a Host that is not one", () => {
    expect(worker("other.localhost", "/")).toBeUndefined();
    expect(worker("acme.localhost.evil", "/")).toBeUndefined();
    expect(worker("a b", "/")).toBeUndefined();
  });
});
