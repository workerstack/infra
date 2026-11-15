import { describe, expect, it } from "vitest";

import { recordingClient, zoneConfig } from "./__fixtures__/recording-client.ts";
import { getHstsLiveState } from "./get-hsts-live-state.ts";
import { setSslSettings } from "./set-ssl-settings.ts";

const HEADER = {
  strict_transport_security: {
    enabled: true,
    include_subdomains: true,
    max_age: 63_072_000,
    nosniff: true,
    preload: true,
  },
};

describe("getHstsLiveState", () => {
  it("reads security_header into camelCase", async () => {
    const { calls, client } = recordingClient(() => ({ id: "security_header", value: HEADER }));

    expect(await getHstsLiveState(client)).toStrictEqual({
      enabled: true,
      includeSubDomains: true,
      maxAge: 63_072_000,
      nosniff: true,
      preload: true,
    });
    expect(calls).toStrictEqual([{ body: undefined, method: "GET", path: "/zones/zid/settings/security_header" }]);
  });

  it("reads back what setSslSettings wrote", async () => {
    const writer = recordingClient();
    const hsts = { enabled: true, includeSubDomains: true, maxAge: 31_536_000, nosniff: false, preload: true };

    await setSslSettings(writer.client, zoneConfig({ ssl: { hsts } }));

    const written = writer.calls.find((call) => call.path.endsWith("security_header"))?.body;
    const reader = recordingClient(() => ({ id: "security_header", ...written }));

    expect(await getHstsLiveState(reader.client)).toStrictEqual(hsts);
  });
});
