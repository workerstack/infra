import { expect, it } from "vitest";

import { routedClient } from "../provision/__fixtures__/routed-client.ts";
import type { CloudflareTurnstileEnv } from "../schema/cloudflare-env.ts";
import { verifyTurnstileConfig } from "./verify-turnstile-config.ts";

const WIDGET = "/accounts/acc/challenges/widgets";

const LIVE = {
  clearance_level: "managed",
  domains: ["example.com"],
  mode: "managed",
  name: "Example",
  secret: "never-reported",
  sitekey: "key1",
};

function declared(siteKey: string): CloudflareTurnstileEnv {
  return { domains: ["example.com"], mode: "managed", name: "Example", siteKey };
}

it("verifyTurnstileConfig reads the widget by site key and tags it with its scope", async () => {
  const { client } = routedClient({ [`GET ${WIDGET}/key1`]: LIVE });

  const results = await verifyTurnstileConfig(client, "acc", { prod: declared("key1") });

  expect(results).toStrictEqual([
    {
      clearanceLevel: "managed",
      domains: ["example.com"],
      env: "prod",
      mode: "managed",
      name: "Example",
      sitekey: "key1",
    },
  ]);
});

it("verifyTurnstileConfig skips a STUB or empty site key and a widget Cloudflare lacks", async () => {
  const { calls, client } = routedClient({});

  const results = await verifyTurnstileConfig(client, "acc", {
    dev: declared("STUB"),
    local: declared(""),
    prod: declared("lost"),
  });

  expect(results).toStrictEqual([]);
  expect(calls.map((call) => call.path)).toStrictEqual([`${WIDGET}/lost`]);
});
