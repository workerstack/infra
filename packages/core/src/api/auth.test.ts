import { describe, expect, it } from "vitest";

import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { accountAuth } from "./auth.ts";

const global = {
  CLOUDFLARE_ACCOUNT_EMAIL: "ops@example.com",
  CLOUDFLARE_ACCOUNT_ID: "acc",
  CLOUDFLARE_API_KEY: "key",
};

describe("accountAuth", () => {
  it("uses the API token when the env has one", () => {
    expect(accountAuth(fakeInfraEnv({ global: { ...global, CLOUDFLARE_API_TOKEN: "tok" } }))).toStrictEqual({
      token: "tok",
      type: "token",
    });
  });

  it("falls back to the email and global key", () => {
    expect(accountAuth(fakeInfraEnv({ global }))).toStrictEqual({
      email: "ops@example.com",
      key: "key",
      type: "global-key",
    });
  });

  it("throws the fix line for a missing credential", () => {
    expect(() => accountAuth(fakeInfraEnv({ global: {} }))).toThrow("has no global value");
  });
});
