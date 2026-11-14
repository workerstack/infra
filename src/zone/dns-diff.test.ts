import { describe, expect, it } from "vitest";

import { DOMAIN } from "./__fixtures__/dns-declared.ts";
import type { DnsMatchScope } from "./dns-diff.ts";
import { findLiveMatch, needsUpdate } from "./dns-diff.ts";
import type { CfDnsRecord } from "./dns-types.ts";

function live(record: Partial<CfDnsRecord> & Pick<CfDnsRecord, "content" | "id" | "type">): CfDnsRecord {
  return { locked: false, name: DOMAIN, proxied: false, ttl: 1, ...record };
}

function scope(records: CfDnsRecord[], claimed: string[] = []): DnsMatchScope {
  return { claimed: new Set(claimed), domain: DOMAIN, live: records };
}

describe("findLiveMatch", () => {
  it("prefers the exact content match", () => {
    const records = [
      live({ content: "1.1.1.1", id: "a", type: "A" }),
      live({ content: "2.2.2.2", id: "b", type: "A" }),
    ];

    expect(findLiveMatch({ content: "2.2.2.2", name: "@", type: "A" }, scope(records))?.id).toBe("b");
  });

  it("takes the single record of that type and name when the content drifted", () => {
    const records = [live({ content: "1.1.1.1", id: "a", type: "A" })];

    expect(findLiveMatch({ content: "9.9.9.9", name: "@", type: "A" }, scope(records))?.id).toBe("a");
  });
});

describe("findLiveMatch identity", () => {
  it("tells TXT records apart by their leading token", () => {
    const records = [
      live({ content: '"google-site-verification=abc"', id: "gsc", type: "TXT" }),
      live({ content: '"v=spf1 ~all"', id: "spf", type: "TXT" }),
    ];

    expect(findLiveMatch({ content: "v=spf1 -all", name: "@", type: "TXT" }, scope(records))?.id).toBe("spf");
  });

  it("tells MX records apart by priority", () => {
    const records = [
      live({ content: "a.example.net.", id: "mx10", priority: 10, type: "MX" }),
      live({ content: "b.example.net.", id: "mx20", priority: 20, type: "MX" }),
    ];

    expect(findLiveMatch({ content: "c.example.net", name: "@", priority: 20, type: "MX" }, scope(records))?.id).toBe(
      "mx20",
    );
  });

  it("skips records already claimed", () => {
    const records = [live({ content: "1.1.1.1", id: "a", type: "A" })];

    expect(findLiveMatch({ content: "1.1.1.1", name: "@", type: "A" }, scope(records, ["a"]))).toBeUndefined();
  });
});

describe("needsUpdate", () => {
  const record = live({ comment: "note", content: "1.1.1.1", id: "a", proxied: true, ttl: 1, type: "A" });

  const declared = {
    comment: "note",
    content: "1.1.1.1",
    name: "@",
    proxied: true,
    ttl: "auto" as const,
    type: "A" as const,
  };

  it("is false when nothing differs", () => {
    expect(needsUpdate(declared, record)).toBe(false);
  });

  it.each([{ content: "2.2.2.2" }, { proxied: false }, { ttl: 300 }, { comment: "other" }])(
    "is true for %j",
    (patch) => {
      expect(needsUpdate({ ...declared, ...patch }, record)).toBe(true);
    },
  );
});
