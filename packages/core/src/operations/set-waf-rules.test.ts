import { describe, expect, it } from "vitest";

import { buildScannerExpression } from "../presets/build-scanner-expression.ts";
import { SCANNER_PATHS } from "../presets/scanner-paths.ts";
import type { ZoneConfigInput } from "../schema/zone.ts";
import { recordingClient, rulesOf, zoneConfig, zoneHolding } from "./__fixtures__/recording-client.ts";
import { setWafRules } from "./set-waf-rules.ts";

type Sent = { action: string; description: string; enabled: boolean; expression: string };

async function sentRules(waf: ZoneConfigInput["waf"]): Promise<Sent[]> {
  const { calls, client } = recordingClient(zoneHolding({ http_request_firewall_custom: [] }));

  await setWafRules(client, zoneConfig({ waf }));

  return rulesOf<Sent>(calls[1]);
}

describe("setWafRules", () => {
  it("blocks the scanner paths by default", async () => {
    expect(await sentRules({})).toStrictEqual([
      {
        action: "block",
        description: "Block vulnerability scanners",
        enabled: true,
        expression: buildScannerExpression(SCANNER_PATHS),
      },
    ]);
  });

  it("adds the extra scanner paths", async () => {
    const rules = await sentRules({ scannerBlock: { extra: ["/secret"] } });

    expect(rules[0]?.expression).toBe(buildScannerExpression([...SCANNER_PATHS, "/secret"]));
  });

  it("sends the scanner rule before the config's own rules", async () => {
    const rules = await sentRules({
      rules: [{ action: "log", description: "mine", enabled: false, expression: "E" }],
    });

    expect(rules.map((rule) => rule.description)).toStrictEqual(["Block vulnerability scanners", "mine"]);
    expect(rules[1]).toStrictEqual({ action: "log", description: "mine", enabled: false, expression: "E" });
  });

  it("sends nothing when there is no scanner block and no rules", async () => {
    const { calls, client } = recordingClient();

    await setWafRules(client, zoneConfig({ waf: { scannerBlock: false } }));

    expect(calls).toStrictEqual([]);
  });
});
