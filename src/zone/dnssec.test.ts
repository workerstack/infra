import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { enableDnssec, getDnssecStatus } from "./dnssec.ts";

const DS = "example.com. 3600 IN DS 2371 13 2 ABC123DEF456";

describe("getDnssecStatus", () => {
  it("returns the DS record while pending", async () => {
    const { calls, client } = fakeClient(() => ({ ds: DS, status: "pending" }));

    expect(await getDnssecStatus(client)).toStrictEqual({ dsRecord: DS, status: "pending" });
    expect(calls).toStrictEqual([{ body: undefined, method: "GET", path: "/zones/zid/dnssec" }]);
  });

  it("returns no DS record when active", async () => {
    const { client } = fakeClient(() => ({ ds: DS, status: "active" }));

    const status = await getDnssecStatus(client);

    expect(status).toStrictEqual({ dsRecord: undefined, status: "active" });
  });

  it("returns the disabled status", async () => {
    const { client } = fakeClient(() => ({ status: "disabled" }));

    const { status } = await getDnssecStatus(client);

    expect(status).toBe("disabled");
  });
});

describe("enableDnssec", () => {
  it("PATCHes status active when disabled", async () => {
    const { calls, client } = fakeClient(({ method }) =>
      method === "GET" ? { status: "disabled" } : { ds: DS, status: "pending" },
    );

    expect(await enableDnssec(client)).toStrictEqual({ dsRecord: DS, status: "pending" });
    expect(calls.filter((call) => call.method === "PATCH")).toStrictEqual([
      { body: { status: "active" }, method: "PATCH", path: "/zones/zid/dnssec" },
    ]);
  });

  it.each([{ status: "active" }, { ds: "ds-value", status: "pending" }])("sends no PATCH for %j", async (live) => {
    const { calls, client } = fakeClient(() => live);

    const { status } = await enableDnssec(client);

    expect(status).toBe(live.status);
    expect(calls).toHaveLength(1);
  });
});
