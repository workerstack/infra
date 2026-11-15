import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { routedClient } from "./__fixtures__/routed-client.ts";
import { getR2Bucket } from "./get-r2-bucket.ts";
import { getR2Cors } from "./get-r2-cors.ts";
import { getR2CustomDomain } from "./get-r2-custom-domain.ts";
import { getTurnstileWidget } from "./get-turnstile-widget.ts";

const A = "/accounts/acc";

const WIDGET = {
  clearance_level: "no_clearance",
  domains: ["example.com"],
  mode: "managed",
  name: "w",
  secret: "s",
  sitekey: "k",
};

function failing(): ReturnType<typeof fakeClient> {
  return fakeClient(() => {
    throw new Error("CF API failed");
  });
}

describe("R2 reads", () => {
  it("reads a bucket, or undefined when the request fails", async () => {
    const detail = { location: "WEUR", name: "b" };
    const { client } = routedClient({ [`GET ${A}/r2/buckets/b`]: detail });

    expect(await getR2Bucket(client, "acc", "b")).toStrictEqual(detail);
    expect(await getR2Bucket(failing().client, "acc", "b")).toBeUndefined();
  });

  it("reads CORS rules, or none when the request fails", async () => {
    const rules = [{ allowed: { methods: ["GET"], origins: ["https://example.com"] } }];
    const { client } = routedClient({ [`GET ${A}/r2/buckets/b/cors`]: { rules } });

    expect(await getR2Cors(client, "acc", "b")).toStrictEqual(rules);
    expect(await getR2Cors(failing().client, "acc", "b")).toStrictEqual([]);
  });

  it("reads a custom domain, or undefined when the request fails", async () => {
    const detail = { domain: "cdn.example.com", enabled: true, status: { ownership: "active", ssl: "active" } };
    const { client } = routedClient({ [`GET ${A}/r2/buckets/b/domains/custom/cdn.example.com`]: detail });

    expect(await getR2CustomDomain(client, "acc", { bucketName: "b", domain: "cdn.example.com" })).toStrictEqual(
      detail,
    );
    expect(await getR2CustomDomain(failing().client, "acc", { bucketName: "b", domain: "d" })).toBeUndefined();
  });
});

describe("getTurnstileWidget", () => {
  it("returns the widget with its secret in the value", async () => {
    const { client } = routedClient({ [`GET ${A}/challenges/widgets/k`]: WIDGET });

    expect(await getTurnstileWidget(client, "acc", "k")).toStrictEqual(WIDGET);
  });

  it("returns undefined when the request fails", async () => {
    expect(await getTurnstileWidget(failing().client, "acc", "k")).toBeUndefined();
  });
});
