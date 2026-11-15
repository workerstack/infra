import { describe, expect, it } from "vitest";

import { recordingClient, zoneConfig } from "./__fixtures__/recording-client.ts";
import { setAgentReadinessSettings } from "./set-agent-readiness-settings.ts";

const DENIED = "CF API PATCH /zones/zid/settings/content_converter: Not allowed to edit zone setting content_converter";

function ignore(): void {
  // a log that drops its lines
}

describe("setAgentReadinessSettings patching", () => {
  it("patches content_converter on by default", async () => {
    const { calls, client } = recordingClient();

    await setAgentReadinessSettings(client, zoneConfig(), ignore);

    expect(calls).toStrictEqual([
      { body: { value: "on" }, method: "PATCH", path: "/zones/zid/settings/content_converter" },
    ]);
  });

  it("patches it off when the config turns it off", async () => {
    const { calls, client } = recordingClient();
    const config = zoneConfig({ agentReadiness: { markdownForAgents: false } });

    await setAgentReadinessSettings(client, config, ignore);

    expect(calls[0]?.body).toStrictEqual({ value: "off" });
  });
});

describe("setAgentReadinessSettings failing", () => {
  it("logs a skip when the plan does not allow the setting", async () => {
    const { client } = recordingClient(() => {
      throw new Error(DENIED);
    });

    const lines: string[] = [];

    await setAgentReadinessSettings(client, zoneConfig(), (line) => lines.push(line));

    expect(lines).toStrictEqual(["    skipped (plan does not allow content_converter)"]);
  });

  it("rethrows any other failure and logs nothing", async () => {
    const { client } = recordingClient(() => {
      throw new Error("CF API PATCH /x: Invalid zone identifier");
    });

    const lines: string[] = [];

    const run = setAgentReadinessSettings(client, zoneConfig(), (line) => lines.push(line));

    await expect(run).rejects.toThrow("Invalid zone identifier");
    expect(lines).toStrictEqual([]);
  });
});
