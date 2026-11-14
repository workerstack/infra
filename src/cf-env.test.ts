import { describe, expect, it } from "vitest";

import { cfEnv } from "./cf-env.ts";

const global = { CLOUDFLARE_ACCOUNT_ID: "acc", CLOUDFLARE_API_TOKEN: "tok" };

describe("cfEnv", () => {
  it("returns base plus account id and token", () => {
    expect(cfEnv({ global }, { PATH: "/bin" })).toStrictEqual({
      CLOUDFLARE_ACCOUNT_ID: "acc",
      CLOUDFLARE_API_TOKEN: "tok",
      PATH: "/bin",
    });
  });

  it("throws when the token is missing", () => {
    expect(() => cfEnv({ global: { CLOUDFLARE_ACCOUNT_ID: "acc" } }, {})).toThrow(
      "CLOUDFLARE_API_TOKEN has no global value; run bun repo env set CLOUDFLARE_API_TOKEN --scope global",
    );
  });

  it("throws when the account id is missing", () => {
    expect(() => cfEnv({ global: { CLOUDFLARE_API_TOKEN: "tok" } }, {})).toThrow(
      "CLOUDFLARE_ACCOUNT_ID has no global value",
    );
  });

  it("runs the guard first", () => {
    expect(() => cfEnv({ global }, { NODE_ENV: "test" })).toThrow("refusing the account's cloud credentials");
  });
});
