import { describe, expect, it } from "vitest";

import { fakeFetch, okBody } from "./__fixtures__/fake-fetch.ts";
import { cfRequest } from "./cf-request.ts";

const HEADERS = { Authorization: "Bearer tok" };

describe("cfRequest", () => {
  it("sends the headers and a JSON body to the API and returns the result", async () => {
    const { calls, fetcher } = fakeFetch(okBody({ id: "a" }));
    const call = { body: { a: 1 }, headers: HEADERS, label: "CF API", method: "POST", path: "/zones/z/x" };

    expect(await cfRequest(call, fetcher)).toStrictEqual({ id: "a" });
    expect(calls[0]?.url).toBe("https://api.cloudflare.com/client/v4/zones/z/x");
    expect(calls[0]?.init).toStrictEqual({ body: '{"a":1}', headers: HEADERS, method: "POST" });
  });

  it("sends no body when there is none", async () => {
    const { calls, fetcher } = fakeFetch(okBody(null));

    await cfRequest({ headers: HEADERS, label: "CF API", method: "GET", path: "/x" }, fetcher);

    expect(calls[0]?.init).toStrictEqual({ headers: HEADERS, method: "GET" });
  });

  it("throws the labelled error line for a failed envelope", async () => {
    const { fetcher } = fakeFetch({ errors: [{ message: "Invalid zone identifier" }], success: false });
    const call = { headers: HEADERS, label: "CF API", method: "GET", path: "/zones/abc/dns_records" };

    await expect(cfRequest(call, fetcher)).rejects.toThrow(
      "CF API GET /zones/abc/dns_records: Invalid zone identifier",
    );
  });
});
