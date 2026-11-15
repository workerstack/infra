import { expect, it } from "vitest";

import { errorDetail } from "./error-detail.ts";
import { levelOf } from "./level-of.ts";
import { samplingWarning } from "./sampling-warning.ts";
import { summarizeResult } from "./summarize-result.ts";

const FAILING = {
  $metadata: { level: "error", message: "POST /v1/x", trigger: "POST /v1/x" },
  $workers: { event: { response: { status: 500 } }, outcome: "ok", wallTimeMs: 12 },
  timestamp: Date.UTC(2026, 0, 2, 3, 4, 5, 6),
};

it("prints one line per event", () => {
  expect(summarizeResult("events", { events: { events: [FAILING] } })).toStrictEqual([
    "01-02T03:04:05.006 error ok 500 wall=12ms POST /v1/x",
  ]);
});

it("groups invocations and lists their error lines", () => {
  const info = { $metadata: { level: "info", message: "--> POST /v1/x" }, timestamp: 0 };

  expect(summarizeResult("invocations", { invocations: { r1: [info, FAILING] } })).toStrictEqual([
    "r1 POST /v1/x → ok (2 events)",
    "  01-02T03:04:05.006 error ok 500 wall=12ms POST /v1/x",
  ]);
});

it("flattens calculation aggregates", () => {
  const result = { calculations: [{ aggregates: [{ count: 9, groupKey: "ok", value: 9 }], calculation: "count" }] };

  expect(summarizeResult("calculations", result)).toStrictEqual(["count ok = 9 (n=9)"]);
});

it("prints one line per trace with its services and errors", () => {
  const trace = {
    errors: ["D1_ERROR: no such table"],
    rootTransactionName: "GET https://internal/v1/x",
    services: ["acme-saas-prod", "acme-gateway-prod"],
    spans: 8,
    traceDurationMs: 245,
    traceId: "t1",
    traceStartMs: Date.UTC(2026, 0, 2, 3, 4, 5, 6),
  };

  expect(summarizeResult("traces", { traces: [trace] })).toStrictEqual([
    "01-02T03:04:05.006 t1 245ms spans=8 errors=1 [acme-saas-prod, acme-gateway-prod] GET https://internal/v1/x",
    "  ! D1_ERROR: no such table",
  ]);
});

it("prefers $metadata.level and falls back to the pino-numeric source level", () => {
  expect(levelOf({ $metadata: { level: "error" }, source: { level: 30 } })).toBe("error");
  expect(levelOf({ source: { level: 40 } })).toBe("warn");
  expect(levelOf({ source: "plain" })).toBeUndefined();
});

it("warns on sampled event reads only", () => {
  expect(samplingWarning("events", { statistics: { abr_level: 10 } })).toContain("abr_level 10");
  expect(samplingWarning("events", { statistics: { abr_level: 1 } })).toBeUndefined();
  expect(samplingWarning("calculations", { statistics: { abr_level: 10 } })).toBeUndefined();
});

it("surfaces the logged error, key, cause and first named frame", () => {
  const source = {
    err: {
      cause: { message: "Rotate failed: urtok_1" },
      errorKey: "token_refresh_error",
      message: "Failed to refresh token",
      name: "Error",
      stack: "Error: x\n    at Object.entries (<anonymous>)\n    at AuthService.rotate (index.js:1:2)",
    },
  };

  expect(errorDetail(source)).toBe(
    " — Error: Failed to refresh token | key=token_refresh_error | cause: Rotate failed: urtok_1" +
      " | at AuthService.rotate (index.js:1:2)",
  );
  expect(errorDetail({ level: 30 })).toBe("");
});
