import { expect, it } from "vitest";

import { cloudflareConfig } from "../runner/__fixtures__/cloudflare-config.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { product, testHost } from "./__fixtures__/test-host.ts";
import type { GetDeps } from "./get-deps.ts";
import { runGet } from "./run-get.ts";

function deps(lines: string[]): GetDeps {
  return {
    client: () => ({ request: () => Promise.reject(new Error("unused")), zoneId: "zid" }),
    getCloudflare: (_client, target) => {
      lines.push(`cloudflare ${target.name} ${target.accountId}`);

      return Promise.resolve();
    },
    log: (line) => lines.push(line),
    verifyApple: () => Promise.resolve({ jwksReachable: true, oauth: [] }),
    verifyGithub: () => Promise.resolve({ oauth: [] }),
    verifyGoogle: () => Promise.resolve({ oauth: [] }),
    verifyMicrosoft: () => Promise.resolve({ oauth: [] }),
  };
}

it("get reports Cloudflare, then Google, Apple, Microsoft and GitHub under their headings", async () => {
  const lines: string[] = [];
  const web = product("apps/web", { apple: {}, cloudflare: cloudflareConfig(), github: {}, google: {}, microsoft: {} });
  const { host, out } = testHost([web]);

  expect(await runGet([], host, deps(lines))).toBe(0);
  expect(lines).toStrictEqual([
    "cloudflare apps/web acc",
    "\n Google: apps/web",
    "\n Apple: apps/web",
    "  JWKS endpoint: reachable ✓",
    "\n Microsoft: apps/web",
    "\n GitHub: apps/web",
  ]);
  expect(out).toStrictEqual(["\n Verification complete."]);
});

it("get names the missing account id for a product that lacks it", async () => {
  const bare = { ...product("apps/web", { cloudflare: cloudflareConfig() }) };
  const config = { ...bare.config, env: fakeInfraEnv() };
  const { err, host } = testHost([{ ...bare, config }]);

  expect(await runGet([], host, deps([]))).toBe(1);
  expect(err).toStrictEqual([
    "infra get: apps/web: CLOUDFLARE_ACCOUNT_ID has no global value; " +
      "run bun repo env set CLOUDFLARE_ACCOUNT_ID --scope global",
  ]);
});
