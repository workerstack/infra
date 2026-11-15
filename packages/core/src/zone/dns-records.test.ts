import { describe, expect, expectTypeOf, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import {
  DKIM_CF,
  DKIM_CF_KEY,
  DKIM_SES_KEY,
  DMARC_REJECT,
  DMARC_RUA,
  DOMAIN,
  SPF_ROOT,
} from "./__fixtures__/dns-declared.ts";
import { isManaged, listAllDnsRecords, matchRecord, normalizeContent, resolveTtl } from "./dns-records.ts";
import type { CfDnsRecord, DnsReconcileResult, DnssecStatus } from "./dns-types.ts";
import { resolveName } from "./resolve-name.ts";

describe("resolveName", () => {
  it.each([
    ["@", "example.com"],
    ["", "example.com"],
    ["example.com", "example.com"],
    ["_dmarc.example.com", "_dmarc.example.com"],
    ["_dmarc", "_dmarc.example.com"],
    ["cf2024-1._domainkey", "cf2024-1._domainkey.example.com"],
    ["www", "www.example.com"],
    ["send", "send.example.com"],
  ])("resolves %j to %j", (name, expected) => {
    expect(resolveName(name, DOMAIN)).toBe(expected);
  });
});

describe("matchRecord", () => {
  it("matches an A record with the @ name resolved", () => {
    const declared = { content: "192.0.2.1", name: "@", type: "A" };

    expect(matchRecord(declared, { ...declared, name: DOMAIN }, DOMAIN)).toBe(true);
  });

  it("matches MX after the trailing dot is stripped and the priority is checked", () => {
    const declared = { content: "route1.mx.example.net", name: "@", priority: 50, type: "MX" };
    const live = { content: "route1.mx.example.net.", name: DOMAIN, priority: 50, type: "MX" };

    expect(matchRecord(declared, live, DOMAIN)).toBe(true);
    expect(matchRecord(declared, { ...live, priority: 10 }, DOMAIN)).toBe(false);
  });
});

describe("matchRecord TXT", () => {
  it("matches TXT after the CF outer quotes are stripped", () => {
    const declared = { content: SPF_ROOT, name: "@", type: "TXT" };

    expect(matchRecord(declared, { content: `"${SPF_ROOT}"`, name: DOMAIN, type: "TXT" }, DOMAIN)).toBe(true);
  });

  it("matches a chunked DKIM key by joining the chunks", () => {
    const declared = { content: DKIM_CF, name: "cf2024-1._domainkey", type: "TXT" };

    const live = {
      content: `"${DKIM_CF.slice(0, 200)}" "${DKIM_CF.slice(200)}"`,
      name: `cf2024-1._domainkey.${DOMAIN}`,
      type: "TXT",
    };

    expect(matchRecord(declared, live, DOMAIN)).toBe(true);
  });

  it("matches a quoted key with the quotes stripped", () => {
    const declared = { content: `p=${DKIM_SES_KEY}`, name: "mail._domainkey", type: "TXT" };
    const live = { content: `"p=${DKIM_SES_KEY}"`, name: `mail._domainkey.${DOMAIN}`, type: "TXT" };

    expect(matchRecord(declared, live, DOMAIN)).toBe(true);
  });
});

describe("matchRecord drift", () => {
  it("rejects an SPF whose policy differs", () => {
    const declared = { content: SPF_ROOT, name: "@", type: "TXT" };
    const live = { content: '"v=spf1 include:_spf.mx.example.net ~all"', name: DOMAIN, type: "TXT" };

    expect(matchRecord(declared, live, DOMAIN)).toBe(false);
  });

  it("rejects a DMARC whose policy differs", () => {
    const declared = { content: DMARC_REJECT, name: "_dmarc", type: "TXT" };
    const live = { content: `"v=DMARC1; p=none; rua=${DMARC_RUA}"`, name: `_dmarc.${DOMAIN}`, type: "TXT" };

    expect(matchRecord(declared, live, DOMAIN)).toBe(false);
  });

  it("rejects a different type", () => {
    const declared = { content: "192.0.2.1", name: "@", type: "A" };

    expect(matchRecord(declared, { ...declared, name: DOMAIN, type: "AAAA" }, DOMAIN)).toBe(false);
  });
});

describe("matchRecord CNAME", () => {
  it("matches a CNAME with the bare name resolved", () => {
    const declared = { content: DOMAIN, name: "www", type: "CNAME" };

    expect(matchRecord(declared, { ...declared, name: `www.${DOMAIN}` }, DOMAIN)).toBe(true);
  });
});

describe("normalizeContent", () => {
  it("joins quoted TXT chunks and leaves other types alone", () => {
    expect(normalizeContent("TXT", `"${DKIM_CF_KEY.slice(0, 5)}" "rest"`)).toBe(`${DKIM_CF_KEY.slice(0, 5)}rest`);
    expect(normalizeContent("TXT", "plain")).toBe("plain");
    expect(normalizeContent("MX", "mx.example.net.")).toBe("mx.example.net");
    expect(normalizeContent("A", "192.0.2.1")).toBe("192.0.2.1");
  });
});

describe("resolveTtl", () => {
  it("maps auto and undefined to 1 and passes numbers through", () => {
    expect(resolveTtl("auto")).toBe(1);
    expect(resolveTtl(undefined)).toBe(1);
    expect(resolveTtl(3600)).toBe(3600);
  });
});

describe("isManaged", () => {
  const base: CfDnsRecord = { content: "x", id: "i", locked: false, name: "n", proxied: false, ttl: 1, type: "A" };

  it.each([
    [{ locked: true }, true],
    [{ meta: { managed_by_apps: true } }, true],
    [{ meta: { auto_added: true } }, true],
    [{}, false],
  ])("is %j -> %j", (patch, expected) => {
    expect(isManaged({ ...base, ...patch })).toBe(expected);
  });
});

describe("listAllDnsRecords", () => {
  it("asks for the next page while a page is full", async () => {
    const filler: CfDnsRecord = {
      content: "0.0.0.0",
      id: "f",
      locked: true,
      name: DOMAIN,
      proxied: false,
      ttl: 1,
      type: "A",
    };

    const full = Array.from({ length: 100 }, () => filler);
    const { calls, client } = fakeClient(({ path }) => (path.endsWith("page=1") ? full : [filler]));

    const all = await listAllDnsRecords(client);

    expect(all).toHaveLength(101);
    expect(calls.map((call) => call.path)).toStrictEqual([
      "/zones/zid/dns_records?per_page=100&page=1",
      "/zones/zid/dns_records?per_page=100&page=2",
    ]);
  });
});

describe("DNS result types", () => {
  it("keep the documented shapes", () => {
    expectTypeOf<DnsReconcileResult>().toHaveProperty("undeclared");
    expectTypeOf<DnssecStatus>().toHaveProperty("dsRecord");
    expectTypeOf(resolveName).returns.toEqualTypeOf<string>();
    expectTypeOf(matchRecord).returns.toEqualTypeOf<boolean>();
  });
});
