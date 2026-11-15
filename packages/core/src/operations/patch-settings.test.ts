import { describe, expect, it } from "vitest";

import { recordingClient } from "./__fixtures__/recording-client.ts";
import { patchSettings } from "./patch-settings.ts";

describe("patchSettings", () => {
  it("patches every entry in order", async () => {
    const { calls, client } = recordingClient();

    await patchSettings(client, [
      ["a", "on"],
      ["b", "off"],
    ]);

    expect(calls.map((call) => [call.path, call.body])).toStrictEqual([
      ["/zones/zid/settings/a", { value: "on" }],
      ["/zones/zid/settings/b", { value: "off" }],
    ]);
  });

  it("sends nothing for no entries", async () => {
    const { calls, client } = recordingClient();

    await patchSettings(client, []);

    expect(calls).toStrictEqual([]);
  });
});
