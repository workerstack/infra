import { describe, expect, it } from "vitest";

import type { Answer } from "../shared/__fixtures__/fake-client.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { DECLARED_RECORDS, DOMAIN } from "./__fixtures__/dns-declared.ts";
import { LIVE_RECORDS } from "./__fixtures__/dns-live.ts";
import { RECONCILED_RECORDS } from "./__fixtures__/dns-reconciled.ts";
import type { CfDnsRecord } from "./dns-types.ts";
import { verifyDnsConfig } from "./verify-dns-config.ts";

const CONFIG = { dns: { records: DECLARED_RECORDS }, domain: DOMAIN };

function verifyAnswer(live: CfDnsRecord[]): Answer {
  return ({ path }) => (path.endsWith("/dnssec") ? { status: "disabled" } : live);
}

describe("verifyDnsConfig", () => {
  it("reports nothing missing or undeclared when live matches", async () => {
    const { client } = fakeClient(verifyAnswer(RECONCILED_RECORDS));

    const result = await verifyDnsConfig(client, CONFIG);

    expect(result).toStrictEqual({
      declared: DECLARED_RECORDS.length,
      dnssec: { dsRecord: undefined, status: "disabled" },
      live: RECONCILED_RECORDS.length,
      missing: [],
      undeclared: [],
    });
  });

  it("lists the drifted and absent records as missing", async () => {
    const { client } = fakeClient(verifyAnswer(LIVE_RECORDS));

    const { missing } = await verifyDnsConfig(client, CONFIG);

    expect(missing.map(({ name }) => name)).toStrictEqual([`www.${DOMAIN}`, DOMAIN, `_dmarc.${DOMAIN}`]);
  });

  it("lists unmanaged live records that are not declared", async () => {
    const { client } = fakeClient(verifyAnswer(LIVE_RECORDS));

    const { undeclared } = await verifyDnsConfig(client, CONFIG);

    expect(undeclared.map(({ name }) => name)).toStrictEqual([DOMAIN, `_dmarc.${DOMAIN}`]);
  });
});

describe("verifyDnsConfig requests", () => {
  it("reads the zone's DNS and DNSSEC", async () => {
    const { calls, client } = fakeClient(verifyAnswer([]));

    await verifyDnsConfig(client, { dns: { records: [] }, domain: DOMAIN });

    expect(calls.map((call) => `${call.method} ${call.path}`)).toStrictEqual([
      "GET /zones/zid/dns_records?per_page=100&page=1",
      "GET /zones/zid/dnssec",
    ]);
  });
});
