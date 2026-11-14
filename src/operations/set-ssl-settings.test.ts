import { describe, expect, it } from "vitest";

import type { HstsConfigInput, SslConfigInput } from "../schema/ssl.ts";
import { recordingClient, zoneConfig } from "./__fixtures__/recording-client.ts";
import type { Recorded } from "./__fixtures__/recording-client.ts";
import { setSslSettings } from "./set-ssl-settings.ts";

async function patches(ssl: SslConfigInput): Promise<Recorded[]> {
  const { calls, client } = recordingClient();

  await setSslSettings(client, zoneConfig({ ssl }));

  return calls;
}

function bodyFor(calls: Recorded[], setting: string): object | undefined {
  return calls.find((call) => call.path === `/zones/zid/settings/${setting}`)?.body;
}

async function headerFor(hsts: HstsConfigInput): Promise<object | undefined> {
  return bodyFor(await patches({ hsts }), "security_header");
}

describe("setSslSettings TLS settings", () => {
  it("writes the five settings in order, all by PATCH", async () => {
    const calls = await patches({});

    expect(calls.map((call) => `${call.method} ${call.path}`)).toStrictEqual([
      "PATCH /zones/zid/settings/always_use_https",
      "PATCH /zones/zid/settings/automatic_https_rewrites",
      "PATCH /zones/zid/settings/min_tls_version",
      "PATCH /zones/zid/settings/tls_1_3",
      "PATCH /zones/zid/settings/security_header",
    ]);
  });

  it("serializes the boolean settings as on and off", async () => {
    const calls = await patches({ alwaysHttps: false, autoRewrites: false, tls13: false });

    expect(bodyFor(calls, "always_use_https")).toStrictEqual({ value: "off" });
    expect(bodyFor(calls, "automatic_https_rewrites")).toStrictEqual({ value: "off" });
    expect(bodyFor(calls, "tls_1_3")).toStrictEqual({ value: "off" });
  });

  it("passes minTls as it is", async () => {
    expect(bodyFor(await patches({ minTls: "1.3" }), "min_tls_version")).toStrictEqual({ value: "1.3" });
  });
});

describe("setSslSettings security_header", () => {
  it("sends a nested object with CF's snake_case keys", async () => {
    const hsts = { enabled: true, includeSubDomains: true, maxAge: 31_536_000, nosniff: true, preload: true };

    expect(await headerFor(hsts)).toStrictEqual({
      value: {
        strict_transport_security: {
          enabled: true,
          include_subdomains: true,
          max_age: 31_536_000,
          nosniff: true,
          preload: true,
        },
      },
    });
  });
});

describe("setSslSettings disabled security_header", () => {
  it("sends a disabled HSTS state to clear the header at the edge", async () => {
    const hsts = { enabled: false, includeSubDomains: false, maxAge: 0, nosniff: false, preload: false };

    expect(await headerFor(hsts)).toStrictEqual({
      value: {
        strict_transport_security: {
          enabled: false,
          include_subdomains: false,
          max_age: 0,
          nosniff: false,
          preload: false,
        },
      },
    });
  });

  it("keeps preload off while the header is enabled", async () => {
    expect(JSON.stringify(await headerFor({ enabled: true, preload: false }))).toContain('"preload":false');
  });
});
