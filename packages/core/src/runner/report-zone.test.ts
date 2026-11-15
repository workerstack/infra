import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { reportDns } from "./report-dns.ts";
import { reportDrift } from "./report-drift.ts";
import { reportRules } from "./report-rules.ts";
import { reportSettings } from "./report-settings.ts";

it("reportRules prints (none) for an empty phase", () => {
  const { lines, log } = logLines();

  reportRules("WAF Custom Rules", [], log);

  expect(lines).toStrictEqual(["  WAF Custom Rules: (none)"]);
});

it("reportRules prints each rule as [ON|OFF] description — action", () => {
  const { lines, log } = logLines();

  reportRules(
    "Cache Rules",
    [
      { action: "set_cache_settings", description: "static", enabled: true },
      { action: "block", description: "old", enabled: false },
    ],
    log,
  );

  expect(lines).toStrictEqual(["  Cache Rules:", "    [ON] static — set_cache_settings", "    [OFF] old — block"]);
});

it("reportSettings aligns each value at column 30", () => {
  const { lines, log } = logLines();

  reportSettings({ tls_1_3: "on" }, log);

  expect(lines).toStrictEqual(["  Settings:", `    ${"tls_1_3".padEnd(30)} on`]);
});

it("reportDns prints counts, missing, undeclared, the status and the DS record", () => {
  const { lines, log } = logLines();
  const missing = { content: "1.1.1.1", name: "example.com", type: "A" };
  const stray = { content: "2.2.2.2", name: "x.example.com", type: "A" };

  const dnssec = { dsRecord: "DS abc", status: "pending" };

  reportDns({ declared: 2, dnssec, live: 1, missing: [missing], undeclared: [stray] }, log);

  expect(lines).toStrictEqual([
    "  DNS Records:",
    "    Declared: 2  Live: 1",
    "    Missing (1):",
    "      ✗ A example.com → 1.1.1.1",
    "    Undeclared (1):",
    "      ⚠ A x.example.com → 2.2.2.2",
    "    DNSSEC: pending",
    "    DS Record: DS abc",
  ]);
});

it("reportDns says all declared records were found when none is missing", () => {
  const { lines, log } = logLines();

  reportDns({ declared: 1, dnssec: { status: "active" }, live: 1, missing: [], undeclared: [] }, log);

  expect(lines).toContain("    All declared records found ✓");
  expect(lines).not.toContain("    DS Record: undefined");
});

it("reportDrift prints missing with - and extra with +, or in sync", () => {
  const { lines, log } = logLines();
  const section = { format: (item: string) => item, label: "Routes" };

  reportDrift({ declared: 1, extra: ["b"], live: 1, missing: ["a"] }, section, log);
  reportDrift({ declared: 0, extra: [], live: 0, missing: [] }, section, log);

  expect(lines).toStrictEqual([
    "  Routes: declared=1 live=1",
    "    ⚠ missing on zone (1):",
    "      - a",
    "    ⚠ extra on zone (1):",
    "      + b",
    "  Routes: declared=0 live=0",
    "    → in sync",
  ]);
});
