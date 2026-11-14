import { describe, expect, it } from "vitest";

import { fakeFetch, okBody } from "./__fixtures__/fake-fetch.ts";
import type { CfAuth } from "./auth.ts";
import { createClient } from "./client.ts";

const TOKEN: CfAuth = { token: "tok", type: "token" };
const KEY: CfAuth = { email: "ops@example.com", key: "key", type: "global-key" };

describe("createClient requests", () => {
  it("sends a token as a Bearer header and returns the result", async () => {
    const { calls, fetcher } = fakeFetch(okBody([{ id: "r1" }]));
    const result = await createClient(TOKEN, "zone1", fetcher).request("GET", "/zones/zone1/dns_records");

    expect(result).toStrictEqual([{ id: "r1" }]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.cloudflare.com/client/v4/zones/zone1/dns_records");
    expect(calls[0]?.init.method).toBe("GET");
    expect(calls[0]?.init.headers).toStrictEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
    expect(calls[0]?.init.body).toBeUndefined();
  });

  it("sends the global key and email headers, and a JSON body", async () => {
    const { calls, fetcher } = fakeFetch(okBody({}));

    await createClient(KEY, "zone1", fetcher).request("POST", "/zones/zone1/x", { a: 1 });

    expect(calls[0]?.init.headers).toStrictEqual({
      "Content-Type": "application/json",
      "X-Auth-Email": "ops@example.com",
      "X-Auth-Key": "key",
    });
    expect(calls[0]?.init.body).toBe('{"a":1}');
  });

  it("exposes its zone id", () => {
    expect(createClient(TOKEN, "zone9", fakeFetch({}).fetcher).zoneId).toBe("zone9");
  });
});

describe("createClient errors", () => {
  it("throws the CF API line with every message", async () => {
    const { fetcher } = fakeFetch({
      errors: [{ message: "Invalid zone identifier" }, { message: "again" }],
      success: false,
    });

    await expect(createClient(TOKEN, "abc", fetcher).request("GET", "/zones/abc/dns_records")).rejects.toThrow(
      "CF API GET /zones/abc/dns_records: Invalid zone identifier, again",
    );
  });

  it("rejects a body that is not an envelope", async () => {
    const { fetcher } = fakeFetch({ nope: 1 });

    await expect(createClient(TOKEN, "z", fetcher).request("GET", "/x")).rejects.toThrow("success");
  });
});
