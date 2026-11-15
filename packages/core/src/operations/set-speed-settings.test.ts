import { describe, expect, it } from "vitest";

import { recordingClient, zoneConfig } from "./__fixtures__/recording-client.ts";
import { setSpeedSettings } from "./set-speed-settings.ts";

describe("setSpeedSettings", () => {
  it("patches fonts then early hints, on by default", async () => {
    const { calls, client } = recordingClient();

    await setSpeedSettings(client, zoneConfig());

    expect(calls.map((call) => [call.method, call.path, call.body])).toStrictEqual([
      ["PATCH", "/zones/zid/settings/fonts", { value: "on" }],
      ["PATCH", "/zones/zid/settings/early_hints", { value: "on" }],
    ]);
  });

  it("patches off for a disabled setting", async () => {
    const { calls, client } = recordingClient();

    await setSpeedSettings(client, zoneConfig({ speed: { earlyHints: false, fonts: false } }));

    expect(calls.map((call) => call.body)).toStrictEqual([{ value: "off" }, { value: "off" }]);
  });
});
