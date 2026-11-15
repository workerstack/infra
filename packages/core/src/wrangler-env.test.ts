import { describe, expect, it } from "vitest";

import { fakeInfraEnv } from "./shared/__fixtures__/fake-infra-env.ts";
import { wranglerEnv } from "./wrangler-env.ts";

const full = {
  CLOUDFLARE_ACCOUNT_EMAIL: "a@b.c",
  CLOUDFLARE_ACCOUNT_ID: "acc",
  CLOUDFLARE_API_KEY: "key",
  CLOUDFLARE_API_TOKEN: "tok",
};

describe("wranglerEnv credentials", () => {
  it("returns base plus the credentials", () => {
    expect(wranglerEnv(fakeInfraEnv({ global: full }), { PATH: "/bin" })).toStrictEqual({
      CI: "true",
      CLOUDFLARE_ACCOUNT_ID: "acc",
      CLOUDFLARE_API_KEY: "key",
      CLOUDFLARE_API_TOKEN: "tok",
      CLOUDFLARE_EMAIL: "a@b.c",
      PATH: "/bin",
    });
  });

  it("drops a base token when the env has none", () => {
    const { CLOUDFLARE_API_TOKEN: _token, ...rest } = full;
    const result = wranglerEnv(fakeInfraEnv({ global: rest }), { CLOUDFLARE_API_TOKEN: "shell" });
    expect(result.CLOUDFLARE_API_TOKEN).toBeUndefined();
  });

  it("throws the missing-key line", () => {
    expect(() => wranglerEnv(fakeInfraEnv({ global: { ...full, CLOUDFLARE_API_KEY: "" } }), {})).toThrow(
      "CLOUDFLARE_API_KEY has no global value; run bun repo env set CLOUDFLARE_API_KEY --scope global",
    );
  });
});

describe("wranglerEnv guard", () => {
  it("runs the guard before any read", () => {
    const global = new Proxy(
      {},
      {
        get: () => {
          throw new Error("read");
        },
      },
    );

    expect(() => wranglerEnv(fakeInfraEnv({ global }), { VITEST: "true" })).toThrow(
      "refusing the account's cloud credentials",
    );
  });
});
