import { expect, it } from "vitest";

import { buildQueryBody } from "./build-query-body.ts";
import { parseQueryArgs } from "./parse-query-args.ts";
import type { QueryArgs } from "./query-args.ts";
import { timeframe } from "./timeframe.ts";

function argsOf(overrides: Partial<QueryArgs> = {}): QueryArgs {
  const parsed = parseQueryArgs(["acme"]);

  if (parsed.kind !== "run") throw new Error("default args must parse");

  return { ...parsed.args, ...overrides };
}

it("defaults to prod events over the last hour", () => {
  expect(argsOf()).toStrictEqual({
    errors: false,
    filters: [],
    from: undefined,
    groupBy: "$workers.outcome",
    limit: 50,
    minutes: 60,
    needle: undefined,
    scope: "prod",
    selectors: ["acme"],
    to: undefined,
    view: "events",
  });
});

it("takes an absolute ISO window and rejects a bad one", () => {
  const parsed = parseQueryArgs(["acme", "--from", "2026-10-03T20:00:00Z", "--to", "2026-10-03T20:20:00Z"]);

  expect(parsed.kind === "run" && timeframe(parsed.args, 0)).toStrictEqual({
    from: Date.UTC(2026, 9, 3, 20, 0),
    to: Date.UTC(2026, 9, 3, 20, 20),
  });
  expect(parseQueryArgs(["acme", "--from", "yesterday"]).kind).toBe("error");
  expect(parseQueryArgs(["acme", "--to", "2026-10-03T20:20:00Z"]).kind).toBe("error");
  expect(parseQueryArgs(["acme", "--from", "2026-10-03T21:00:00Z", "--to", "2026-10-03T20:00:00Z"]).kind).toBe("error");
});

it("parses filters with operators; numbers compare as numbers", () => {
  const parsed = parseQueryArgs([
    "acme",
    "--filter",
    "$workers.event.path=/v1/a=b",
    "--filter",
    "$workers.event.response.status>=500",
    "--filter",
    "$metadata.message~timeout",
    "--filter",
    "$workers.outcome!=ok",
  ]);

  expect(parsed.kind === "run" && parsed.args.filters).toStrictEqual([
    { key: "$workers.event.path", operation: "eq", type: "string", value: "/v1/a=b" },
    { key: "$workers.event.response.status", operation: "gte", type: "number", value: 500 },
    { key: "$metadata.message", operation: "includes", type: "string", value: "timeout" },
    { key: "$workers.outcome", operation: "neq", type: "string", value: "ok" },
  ]);
});

it("rejects a bad view, scope, filter, limit or window", () => {
  expect(parseQueryArgs(["acme", "--view", "logs"]).kind).toBe("error");
  expect(parseQueryArgs(["acme", "--scope", "local"]).kind).toBe("error");
  expect(parseQueryArgs(["acme", "--filter", "novalue"]).kind).toBe("error");
  expect(parseQueryArgs(["acme", "--minutes", "0"]).kind).toBe("error");
  expect(parseQueryArgs(["acme", "--limit", "0"]).kind).toBe("error");
});

it("scopes the body to the script and adds the error filter, needle and window", () => {
  const body = buildQueryBody(argsOf({ errors: true, minutes: 10, needle: "req-1" }), "acme-gateway-prod", 1_000_000);

  expect(body).toStrictEqual({
    limit: 50,
    parameters: {
      datasets: ["cloudflare-workers"],
      filters: [
        { key: "$metadata.service", operation: "eq", type: "string", value: "acme-gateway-prod" },
        { key: "$metadata.level", operation: "eq", type: "string", value: "error" },
      ],
      needle: { value: "req-1" },
    },
    queryId: "infra-logs-query",
    timeframe: { from: 400_000, to: 1_000_000 },
    view: "events",
  });
});

it("adds count, median and p99 wall time grouped by the chosen key for calculations", () => {
  const body = buildQueryBody(argsOf({ groupBy: "$workers.event.path", view: "calculations" }), "s", 0);

  expect(body).toMatchObject({
    parameters: {
      calculations: [
        { operator: "count" },
        { key: "$workers.wallTimeMs", keyType: "number", operator: "median" },
        { key: "$workers.wallTimeMs", keyType: "number", operator: "p99" },
      ],
      groupBys: [{ type: "string", value: "$workers.event.path" }],
    },
  });
});
