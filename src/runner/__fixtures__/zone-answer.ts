import type { Answer } from "../../shared/__fixtures__/fake-client.ts";

export const HSTS_LIVE_VALUE = {
  strict_transport_security: { enabled: true, include_subdomains: true, max_age: 63072000, nosniff: true, preload: true },
};

/** What the fake zone holds; anything not given is empty. */
export type ZoneLive = {
  connectors?: object[];
  hsts?: object;
  rulesets?: Record<string, object[]>;
  routes?: object[];
  setting?: string;
};

function rulesetAnswer(path: string, rulesets: Record<string, object[]>): object | undefined {
  if (path === "/zones/zid/rulesets") return Object.keys(rulesets).map((phase) => ({ id: `rs_${phase}`, phase }));

  const id = path.split("/zones/zid/rulesets/")[1];

  return id === undefined ? undefined : { id, rules: rulesets[id.replace("rs_", "")] ?? [] };
}

/** An answer for the reads of `verifyZoneConfig`: rulesets, settings, Cloud Connector, routes and email routing. */
export function zoneAnswer(live: ZoneLive = {}): Answer {
  return ({ path }) => {
    const ruleset = path.startsWith("/zones/zid/rulesets") ? rulesetAnswer(path, live.rulesets ?? {}) : undefined;

    if (ruleset !== undefined) return ruleset;

    if (path.endsWith("/settings/security_header")) return { value: live.hsts ?? HSTS_LIVE_VALUE };

    if (path.includes("/settings/")) return { value: live.setting ?? "on" };

    if (path === "/zones/zid/cloud_connector/rules") return live.connectors ?? [];

    if (path === "/zones/zid/workers/routes") return live.routes ?? [];

    if (path === "/zones/zid/email/routing/rules") return [];

    throw new Error(`unexpected: ${path}`);
  };
}
