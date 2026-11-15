import { describe, expect, it } from "vitest";

import { fakeClient, writes } from "../shared/__fixtures__/fake-client.ts";
import { dnsAnswer } from "./__fixtures__/dns-answer.ts";
import { DECLARED_RECORDS, DMARC_REJECT, DOMAIN, SPF_ROOT } from "./__fixtures__/dns-declared.ts";
import { LIVE_RECORDS } from "./__fixtures__/dns-live.ts";
import { RECONCILED_RECORDS } from "./__fixtures__/dns-reconciled.ts";
import { setDnsRecords } from "./set-dns-records.ts";

const CONFIG = { dns: { records: DECLARED_RECORDS }, domain: DOMAIN };

describe("setDnsRecords reconciliation", () => {
  it("creates www, updates SPF and DMARC and leaves the rest unchanged", async () => {
    const { calls, client } = fakeClient(dnsAnswer(LIVE_RECORDS));

    const result = await setDnsRecords(client, CONFIG);

    expect(result).toMatchObject({ created: 1, unchanged: 9, updated: 2 });
    expect(writes(calls).map(({ method, path }) => `${method} ${path}`)).toStrictEqual([
      "POST /zones/zid/dns_records",
      "PATCH /zones/zid/dns_records/r_spf",
      "PATCH /zones/zid/dns_records/r_dmarc",
    ]);
  });

  it("POSTs the www CNAME with its FQDN", async () => {
    const { calls, client } = fakeClient(dnsAnswer(LIVE_RECORDS));

    await setDnsRecords(client, CONFIG);

    expect(calls.filter((call) => call.method === "POST").map((call) => call.body)).toMatchObject([
      { content: DOMAIN, name: `www.${DOMAIN}`, proxied: true, ttl: 1, type: "CNAME" },
    ]);
  });
});

describe("setDnsRecords writes", () => {
  it("PATCHes the drifted content", async () => {
    const { calls, client } = fakeClient(dnsAnswer(LIVE_RECORDS));

    await setDnsRecords(client, CONFIG);

    const bodies = calls.filter((call) => call.method === "PATCH").map((call) => call.body);

    expect(bodies).toMatchObject([
      { content: SPF_ROOT, type: "TXT" },
      { content: DMARC_REJECT, type: "TXT" },
    ]);
  });
});

describe("setDnsRecords empty zone", () => {
  it("creates every record when the zone is empty", async () => {
    const { calls, client } = fakeClient(dnsAnswer([]));

    const result = await setDnsRecords(client, CONFIG);

    expect(result).toMatchObject({ created: DECLARED_RECORDS.length, unchanged: 0, updated: 0 });
    expect(writes(calls)).toHaveLength(DECLARED_RECORDS.length);
  });

  it("changes nothing when live already matches", async () => {
    const { calls, client } = fakeClient(dnsAnswer(RECONCILED_RECORDS));

    const result = await setDnsRecords(client, CONFIG);

    expect(result).toMatchObject({ created: 0, unchanged: DECLARED_RECORDS.length, updated: 0 });
    expect(writes(calls)).toHaveLength(0);
  });
});

describe("setDnsRecords empty config", () => {
  it("does nothing for empty declared records and reports the unmanaged live ones", async () => {
    const { calls, client } = fakeClient(dnsAnswer(LIVE_RECORDS));

    const result = await setDnsRecords(client, { dns: { records: [] }, domain: DOMAIN });

    expect(result).toMatchObject({ created: 0, unchanged: 0, updated: 0 });
    expect(result.undeclared.length).toBeGreaterThan(0);
    expect(writes(calls)).toHaveLength(0);
  });
});

describe("setDnsRecords TTL", () => {
  it("sends ttl 1 for auto and a numeric TTL as it is", async () => {
    const { calls, client } = fakeClient(dnsAnswer([]));

    const records = [
      { content: "192.0.2.1", name: "@", proxied: true, ttl: "auto" as const, type: "A" as const },
      { content: "mail.example.org", name: "send", priority: 10, ttl: 3600, type: "MX" as const },
    ];

    await setDnsRecords(client, { dns: { records }, domain: DOMAIN });

    expect(calls.filter((call) => call.method === "POST").map((call) => call.body)).toMatchObject([
      { ttl: 1 },
      { ttl: 3600 },
    ]);
  });
});

describe("setDnsRecords undeclared records", () => {
  it("never reports the app-managed record", async () => {
    const { client } = fakeClient(dnsAnswer(LIVE_RECORDS));

    const { undeclared } = await setDnsRecords(client, CONFIG);

    expect(undeclared.map(({ name }) => name)).not.toContain(`cdn.${DOMAIN}`);
  });

  it("reports an unmanaged record that is not declared", async () => {
    const stale = {
      content: "old.example.org",
      id: "r_stale",
      locked: false,
      name: `stale.${DOMAIN}`,
      proxied: false,
      ttl: 300,
      type: "CNAME",
    };

    const { client } = fakeClient(dnsAnswer([...LIVE_RECORDS, stale]));

    const { undeclared } = await setDnsRecords(client, CONFIG);

    expect(undeclared).toContainEqual({ content: "old.example.org", name: `stale.${DOMAIN}`, type: "CNAME" });
  });
});

describe("setDnsRecords locked records", () => {
  it("skips locked NS records", async () => {
    const ns = {
      content: "ns1.example.net",
      id: "r_ns",
      locked: true,
      name: DOMAIN,
      proxied: false,
      ttl: 1,
      type: "NS",
    };

    const { client } = fakeClient(dnsAnswer([...LIVE_RECORDS, ns]));

    const { undeclared } = await setDnsRecords(client, CONFIG);

    expect(undeclared.map(({ type }) => type)).not.toContain("NS");
  });
});
