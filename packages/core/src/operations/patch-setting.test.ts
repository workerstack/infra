import { describe, expect, it } from "vitest";

import { recordingClient } from "./__fixtures__/recording-client.ts";
import { patchSetting } from "./patch-setting.ts";

const HEADER = {
  strict_transport_security: { enabled: true, include_subdomains: true, max_age: 1, nosniff: true, preload: false },
};

describe("patchSetting", () => {
  it("PATCHes the setting with a scalar value", async () => {
    const { calls, client } = recordingClient();

    await patchSetting(client, "fonts", "on");

    expect(calls).toStrictEqual([{ body: { value: "on" }, method: "PATCH", path: "/zones/zid/settings/fonts" }]);
  });

  it("PATCHes a structured value as it is", async () => {
    const { calls, client } = recordingClient();

    await patchSetting(client, "security_header", HEADER);

    expect(calls[0]?.body).toStrictEqual({ value: HEADER });
  });
});
