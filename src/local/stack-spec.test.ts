import { describe, expect, it } from "vitest";

import { landing } from "./landing.ts";
import type { LocalRoute } from "./local-route.ts";
import type { Outside } from "./outside.ts";
import { resolveStack } from "./resolve-stack.ts";
import type { StackCandidate } from "./stack-candidate.ts";
import { stackOf } from "./stack-of.ts";

function candidate(dir: string, kind: StackCandidate["kind"]): StackCandidate {
  const worker = `acme-${dir.replace("/", "-")}`;

  return {
    config: `/p/${dir}/.cloudflare/wrangler.local.json`,
    dir,
    kind,
    name: `${worker}-local`,
    packageDir: `/p/${dir}`,
    routes: [],
    worker,
  };
}

const CANDIDATES = [
  candidate("api/gateway", "worker"),
  candidate("api/extract", "container"),
  candidate("web/landing", "vite"),
  candidate("web/site", "app"),
];

function dirs(members: readonly { dir: string }[]): string[] {
  return members.map((member) => member.dir);
}

describe("resolveStack", () => {
  it("runs Workers and apps, leaving Vite packages and containers out", () => {
    expect(resolveStack(CANDIDATES, {})).toStrictEqual([
      { ...candidate("api/gateway", "worker"), kind: "worker" },
      { ...candidate("web/site", "app"), kind: "app" },
    ]);
  });

  it("adds a container Worker only with --with, and narrows to --only", () => {
    const withBox = resolveStack(CANDIDATES, { with: ["api/extract"] });

    expect(dirs(withBox)).toStrictEqual(["api/gateway", "api/extract", "web/site"]);
    expect(withBox[1]).toMatchObject({ container: true, kind: "worker" });
    expect(dirs(resolveStack(CANDIDATES, { only: ["web/site"] }))).toStrictEqual(["web/site"]);
  });

  it("fails a --with or --only that names no member, listing the valid dirs", () => {
    expect(() => resolveStack(CANDIDATES, { with: ["api/gateway"] })).toThrow(
      "--with api/gateway: not an opt-in Worker (opt-in: api/extract)",
    );
    expect(() => resolveStack([candidate("api/gateway", "worker")], { with: ["x"] })).toThrow("(opt-in: none)");
    expect(() => resolveStack(CANDIDATES, { only: ["web/landing"] })).toThrow(
      "--only web/landing: not in the stack (in it: api/gateway, web/site)",
    );
  });

  it("fails two apps that serve one Worker", () => {
    const twin = { ...candidate("web/site2", "app"), name: candidate("web/site", "app").name };

    expect(() => resolveStack([...CANDIDATES, twin], {})).toThrow(
      "web/site and web/site2 both serve acme-web-site-local",
    );
  });
});

function routed(dir: string, kind: StackCandidate["kind"], worker: string): StackCandidate {
  const route: LocalRoute = {
    host: "acme.localhost",
    hostWildcard: false,
    path: `/${dir.split("/")[1] ?? dir}/`,
    prefix: true,
    worker,
  };

  return { ...candidate(dir, kind), routes: [route], worker };
}

const gateway = routed("api/gateway", "worker", "acme-gateway");
const extract = routed("api/extract", "container", "acme-extract");

const ROUTED = [
  gateway,
  { ...routed("web/gateway", "vite", "acme-gateway"), routes: gateway.routes },
  routed("api/billing", "worker", "acme-billing"),
  extract,
  routed("web/landing", "vite", "acme-landing"),
  candidate("api/cron", "worker"),
];

describe("stackOf", () => {
  it("lists each routed Worker's routes once and says why each unserved one is outside", () => {
    const stack = stackOf(ROUTED, { only: ["api/gateway", "api/cron"] });

    expect(dirs(stack.members)).toStrictEqual(["api/gateway", "api/cron"]);
    expect(stack.routes.map((route) => route.worker)).toStrictEqual([
      "acme-gateway",
      "acme-billing",
      "acme-extract",
      "acme-landing",
    ]);
    expect(Object.fromEntries(stack.outside)).toStrictEqual({
      "acme-billing": { dirs: ["api/billing"], why: "not-chosen" },
      "acme-extract": { dirs: ["api/extract"], why: "opt-in" },
      "acme-landing": { dirs: ["web/landing"], why: "vite" },
    });
  });

  it("names the reason a person can act on when several dirs deploy an unserved Worker", () => {
    const vite = routed("web/extract", "vite", "acme-extract");

    expect(stackOf([vite, extract], {}).outside.get("acme-extract")).toStrictEqual({
      dirs: ["web/extract", "api/extract"],
      why: "opt-in",
    });
    expect(stackOf([extract, vite], {}).outside.get("acme-extract")).toStrictEqual({
      dirs: ["api/extract", "web/extract"],
      why: "opt-in",
    });
  });
});

describe("landing", () => {
  it("lands a request on the member, on the outside Worker, or nowhere", () => {
    const stack = stackOf(ROUTED, { only: ["api/gateway"] });

    expect(landing(stack, "acme.localhost", "/gateway/x")).toStrictEqual({
      kind: "member",
      member: { ...gateway, kind: "worker" },
    });
    expect(landing(stack, "acme.localhost", "/extract/x")).toStrictEqual({
      dirs: ["api/extract"],
      kind: "outside",
      why: "opt-in",
    });
    expect(landing(stack, "acme.localhost", "/nothing")).toBeUndefined();
  });

  it("refuses a route table naming a Worker that is neither a member nor outside", () => {
    const stack = {
      members: [],
      outside: new Map<string, Outside>(),
      routes: routed("x", "worker", "acme-lost").routes,
    };

    expect(() => landing(stack, "acme.localhost", "/x/")).toThrow("route of acme-lost has no member and no outside");
  });
});
