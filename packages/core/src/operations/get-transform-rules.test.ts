import { describe, expect, it } from "vitest";

import { recordingClient, zoneHolding } from "./__fixtures__/recording-client.ts";
import { getTransformRules } from "./get-transform-rules.ts";

const LIVE = {
  action: "rewrite",
  action_parameters: { uri: { path: { expression: 'concat("/cdn/p", http.request.uri.path)' } } },
  description: "/p/* to /cdn/p/*",
  enabled: true,
  expression: 'starts_with(http.request.uri.path, "/p/")',
  id: "r_x",
};

describe("getTransformRules", () => {
  it("flattens the live rules to the schema's shape", async () => {
    const { client } = recordingClient(zoneHolding({ http_request_transform: [LIVE] }));

    expect(await getTransformRules(client)).toStrictEqual([
      {
        description: "/p/* to /cdn/p/*",
        enabled: true,
        expression: 'starts_with(http.request.uri.path, "/p/")',
        pathExpression: 'concat("/cdn/p", http.request.uri.path)',
      },
    ]);
  });

  it("fills empty strings for a rule without an expression or path", async () => {
    const live = { action: "rewrite", description: "d", enabled: false };
    const { client } = recordingClient(zoneHolding({ http_request_transform: [live] }));

    expect(await getTransformRules(client)).toStrictEqual([
      { description: "d", enabled: false, expression: "", pathExpression: "" },
    ]);
  });

  it("returns none, and reads no detail, when the zone has no transform ruleset", async () => {
    const { calls, client } = recordingClient(zoneHolding({}));

    expect(await getTransformRules(client)).toStrictEqual([]);
    expect(calls).toHaveLength(1);
  });
});
