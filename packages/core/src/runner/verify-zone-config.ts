import type { CfClient } from "../api/client.ts";
import { getHstsLiveState } from "../operations/get-hsts-live-state.ts";
import { getRulesetRules } from "../operations/get-ruleset-rules.ts";
import { getSetting } from "../operations/get-setting.ts";
import { getTransformRules } from "../operations/get-transform-rules.ts";
import type { TransformRule } from "../operations/transform-rule.ts";
import type { CloudConnectorRule } from "../schema/edge-rules.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { getCloudConnectorRules } from "../zone/cloud-connector.ts";
import { verifyEmailRouting } from "../zone/email-addresses.ts";
import { getDisabledWorkerRoutes } from "../zone/worker-routes.ts";
import { diffByKey } from "./diff-by-key.ts";
import { ZONE_SETTING_KEYS } from "./zone-setting-keys.constants.ts";
import type { ZoneVerifyResult } from "./zone-verify-result.ts";

// The \u0001 joiner cannot collide with field content: Cloudflare rejects control chars in descriptions.
function transformKey(rule: TransformRule): string {
  return `${rule.description}\u0001${rule.expression}\u0001${rule.pathExpression}`;
}

function connectorKey(rule: CloudConnectorRule): string {
  return `${rule.provider}\u0001${rule.expression}\u0001${rule.host}`;
}

async function readSettings(client: CfClient): Promise<Record<string, string>> {
  const settings: Record<string, string> = {};

  await runInOrder([...ZONE_SETTING_KEYS], async (key) => {
    settings[key] = await getSetting(client, key);
  });

  return settings;
}

/** Reads the live rules, settings, HSTS and drift lists of the zone and compares them with `config`. */
export async function verifyZoneConfig(client: CfClient, config: ZoneConfig): Promise<ZoneVerifyResult> {
  const [waf, rateLimit, redirects, cache, transforms, connectors, routes, emailRouting] = await Promise.all([
    getRulesetRules(client, "http_request_firewall_custom"),
    getRulesetRules(client, "http_ratelimit"),
    getRulesetRules(client, "http_request_dynamic_redirect"),
    getRulesetRules(client, "http_request_cache_settings"),
    getTransformRules(client),
    getCloudConnectorRules(client),
    getDisabledWorkerRoutes(client),
    verifyEmailRouting(client, config),
  ]);

  const settings = await readSettings(client);
  const hsts = await getHstsLiveState(client);

  return {
    cache,
    cloudConnectors: diffByKey(config.cloudConnectors, connectors, connectorKey),
    disabledWorkerRoutes: diffByKey(config.disabledWorkerRoutes, routes, (route) => route),
    emailRouting,
    hsts,
    rateLimit,
    redirects,
    settings,
    transforms: diffByKey(config.transforms.urlRewrites, transforms, transformKey),
    waf,
  };
}
