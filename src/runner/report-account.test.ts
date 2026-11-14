import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { reportAiSearch } from "./report-ai-search.ts";
import { reportBindings } from "./report-bindings.ts";
import { reportDeclaredBindings } from "./report-declared-bindings.ts";
import { reportR2Credentials } from "./report-r2-credentials.ts";
import { reportTurnstile } from "./report-turnstile.ts";
import { reportZoneTurnstile } from "./report-zone-turnstile.ts";

const WIDGET = {
  clearanceLevel: "managed",
  domains: ["example.com", "www.example.com"],
  env: "prod",
  mode: "managed",
  name: "Example",
  sitekey: "key1",
};

it("reportBindings prints each binding with its status, replicas and note", () => {
  const { lines, log } = logLines();

  reportBindings(
    [
      {
        bindings: [
          { binding: "DB", exists: true, name: "db", readReplicas: "auto", type: "D1" },
          { binding: "KV", exists: false, name: "kv1", type: "KV" },
          { binding: "AE", exists: true, name: "ds", note: "auto-created", type: "AE" },
        ],
        env: "dev",
      },
    ],
    log,
  );

  expect(lines).toStrictEqual([
    "  Bindings (verified):",
    "    [dev]:",
    "      D1 DB (db) ✓ [replicas: auto]",
    "      KV KV (kv1) ✗ MISSING",
    "      AE AE (ds) ✓ (auto-created)",
  ]);
});

it("reportR2Credentials prints the key and endpoint status", () => {
  const { lines, log } = logLines();

  reportR2Credentials({ endpointValid: false, hasCredentials: true }, log);
  reportR2Credentials({ endpointValid: true, hasCredentials: false }, log);

  expect(lines).toStrictEqual([
    "  R2 Credentials: keys ✓, endpoint ✗ invalid",
    "  R2 Credentials: keys ✗ missing, endpoint ✓",
  ]);
});

it("reportTurnstile prints each widget over four lines, or (no provisioned widgets)", () => {
  const { lines, log } = logLines();

  reportTurnstile([WIDGET], log);
  reportTurnstile([], log);

  expect(lines).toStrictEqual([
    "  Turnstile:",
    "    [prod] Example (key1):",
    "      Mode: managed",
    "      Clearance: managed",
    "      Domains: example.com, www.example.com",
    "  Turnstile:",
    "    (no provisioned widgets)",
  ]);
});

it("reportZoneTurnstile prints one line per widget, none declared, or none found", () => {
  const { lines, log } = logLines();

  reportZoneTurnstile([WIDGET], log);
  reportZoneTurnstile(undefined, log);
  reportZoneTurnstile([], log);

  expect(lines).toStrictEqual([
    "  Turnstile:",
    "    [prod] Example (key1) mode=managed clearance=managed",
    "      domains: example.com, www.example.com",
    "  Turnstile:",
    "    (none declared)",
    "  Turnstile:",
    "    ⚠ no widgets found on CF for declared sitekeys",
  ]);
});

it("reportAiSearch prints each instance with its mark and status, or (none declared)", () => {
  const { lines, log } = logLines();
  const instance = { embeddingModel: "m", env: "dev", exists: true, instanceName: "s", status: "active" };

  reportAiSearch([instance, { ...instance, exists: false, status: undefined }], log);
  reportAiSearch([], log);

  expect(lines).toStrictEqual([
    "  AI Search:",
    "    [dev] s (m) — ✓ [status: active]",
    "    [dev] s (m) — ⚠ MISSING",
    "  AI Search:",
    "    (none declared)",
  ]);
});

it("reportDeclaredBindings prints wrangler-style JSON lines", () => {
  const { lines, log } = logLines();

  reportDeclaredBindings("dev", { kv_namespaces: { KV: { id: "kv1" } }, queues: { Q: { queue: "jobs" } } }, log);

  expect(lines).toStrictEqual([
    "  Bindings [dev]:",
    '    { "binding": "KV", "id": "kv1" }',
    '    { "binding": "Q", "queue": "jobs" }',
  ]);
});
