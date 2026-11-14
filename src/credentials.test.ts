import { describe, expect, it } from "vitest";

import { cloudflareCredentials, requiredGlobal } from "./credentials.ts";

const full = {
  CLOUDFLARE_ACCOUNT_EMAIL: "a@b.c",
  CLOUDFLARE_ACCOUNT_ID: "acc",
  CLOUDFLARE_API_KEY: "key",
  CLOUDFLARE_API_TOKEN: "tok",
};

function missing(key: string): string {
  return `${key} has no global value; run bun repo env set ${key} --scope global`;
}

describe("cloudflareCredentials reads", () => {
  it("reads the four global keys", () => {
    expect(cloudflareCredentials({ global: full })).toStrictEqual({
      accountEmail: "a@b.c",
      accountId: "acc",
      apiKey: "key",
      apiToken: "tok",
    });
  });

  it("leaves the token undefined when the env has none", () => {
    const { CLOUDFLARE_API_TOKEN: _token, ...rest } = full;
    expect(cloudflareCredentials({ global: rest }).apiToken).toBeUndefined();
  });

  it("reads on call, not at definition", () => {
    const env = { global: { ...full } };

    env.global.CLOUDFLARE_API_KEY = "rotated";

    expect(cloudflareCredentials(env).apiKey).toBe("rotated");
  });
});

describe("cloudflareCredentials missing keys", () => {
  it.each(["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_EMAIL", "CLOUDFLARE_API_KEY"])(
    "throws when %s is missing",
    (key) => {
      expect(() => cloudflareCredentials({ global: { ...full, [key]: undefined } })).toThrow(missing(key));
    },
  );

  it("treats an empty string as missing", () => {
    expect(() => cloudflareCredentials({ global: { ...full, CLOUDFLARE_API_KEY: "" } })).toThrow(
      missing("CLOUDFLARE_API_KEY"),
    );
  });
});

describe("requiredGlobal", () => {
  it("returns the value", () => {
    expect(requiredGlobal({ global: { X: "1" } }, "X")).toBe("1");
  });

  it("throws the missing-key line", () => {
    expect(() => requiredGlobal({ global: {} }, "X")).toThrow(missing("X"));
  });
});
