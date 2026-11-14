import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { applyAnswer } from "./__fixtures__/apply-answer.ts";
import { zoneConfig } from "./__fixtures__/zone-config.ts";
import { applyZoneConfig } from "./apply-zone-config.ts";

const STRAY = {
  content: "1.2.3.4",
  id: "r1",
  locked: false,
  name: "stray.example.com",
  proxied: false,
  ttl: 1,
  type: "A",
};

const LIST = "GET /zones/zid/dns_records?per_page=100&page=1";

it("applyZoneConfig prints the DNS counts and each undeclared record", async () => {
  const { client } = fakeClient(applyAnswer({ [LIST]: [STRAY] }));
  const { lines, log } = logLines();

  await applyZoneConfig(client, zoneConfig(), { log });

  expect(lines).toContain("    → 0 created, 0 updated, 0 unchanged");
  expect(lines).toContain("    ⚠ 1 undeclared record(s) in zone (not managed by config):");
  expect(lines).toContain("      A stray.example.com → 1.2.3.4");
});

it("applyZoneConfig skips DNSSEC unless declared", async () => {
  const { client } = fakeClient(applyAnswer());
  const { lines, log } = logLines();

  await applyZoneConfig(client, zoneConfig(), { log });

  expect(lines).not.toContain("  DNSSEC ...");
});

it("applyZoneConfig prints the DS record to add at the registrar while DNSSEC is pending", async () => {
  const dnssec = { ds: "example.com. 3600 IN DS 1 13 2 abc", status: "pending" };
  const { client } = fakeClient(applyAnswer({ "GET /zones/zid/dnssec": dnssec, "PATCH /zones/zid/dnssec": dnssec }));
  const { lines, log } = logLines();

  await applyZoneConfig(client, zoneConfig({ dns: { dnssec: true } }), { log });

  expect(lines).toContain("  DNSSEC ...");
  expect(lines).toContain("    → pending");
  expect(lines).toContain("    ⚠ Add DS record at your domain registrar:");
  expect(lines).toContain("      example.com. 3600 IN DS 1 13 2 abc");
});
