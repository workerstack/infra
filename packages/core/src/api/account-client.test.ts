import { describe, expect, it } from "vitest";

import { fakeFetch, okBody } from "./__fixtures__/fake-fetch.ts";
import { createAccountClient } from "./account-client.ts";
import type { CfAuth } from "./auth.ts";

const TOKEN: CfAuth = { token: "tok", type: "token" };

describe("createAccountClient", () => {
  it("calls the account-relative path with a Bearer header and returns the result", async () => {
    const { calls, fetcher } = fakeFetch(okBody({ id: "s1" }));
    const client = createAccountClient(TOKEN, "acc1", fetcher);

    expect(await client.request("GET", "/workers/scripts/s1")).toStrictEqual({ id: "s1" });
    expect(client.accountId).toBe("acc1");
    expect(calls[0]?.url).toBe("https://api.cloudflare.com/client/v4/accounts/acc1/workers/scripts/s1");
    expect(calls[0]?.init.headers).toStrictEqual({ Authorization: "Bearer tok", "Content-Type": "application/json" });
    expect(calls[0]?.init.body).toBeUndefined();
  });

  it("sends a JSON body with the PATCH method", async () => {
    const { calls, fetcher } = fakeFetch(okBody({}));

    await createAccountClient(TOKEN, "acc1", fetcher).request("PATCH", "/x", { a: 1 });

    expect(calls[0]?.init.method).toBe("PATCH");
    expect(calls[0]?.init.body).toBe('{"a":1}');
  });

  it("throws the CF API line with the full path and every message", async () => {
    const { fetcher } = fakeFetch({ errors: [{ message: "nope" }, { message: "again" }], success: false });

    await expect(createAccountClient(TOKEN, "acc1", fetcher).request("GET", "/x")).rejects.toThrow(
      "CF API GET /accounts/acc1/x: nope, again",
    );
  });
});
