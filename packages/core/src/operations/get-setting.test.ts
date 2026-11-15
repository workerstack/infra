import { describe, expect, it } from "vitest";

import { recordingClient } from "./__fixtures__/recording-client.ts";
import { getSettingRaw } from "./get-setting-raw.ts";
import { getSetting } from "./get-setting.ts";

describe("getSetting", () => {
  it("GETs the setting and returns its value", async () => {
    const { calls, client } = recordingClient(() => ({ id: "fonts", value: "on" }));

    expect(await getSetting(client, "fonts")).toBe("on");
    expect(calls).toStrictEqual([{ body: undefined, method: "GET", path: "/zones/zid/settings/fonts" }]);
  });
});

describe("getSettingRaw", () => {
  it("returns a structured value as it is", async () => {
    const { client } = recordingClient(() => ({ id: "x", value: { a: 1 } }));

    expect(await getSettingRaw<{ a: number }>(client, "x")).toStrictEqual({ a: 1 });
  });
});
