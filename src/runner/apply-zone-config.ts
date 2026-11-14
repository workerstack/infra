import type { CfClient } from "../api/client.ts";
import { setAgentReadinessSettings } from "../operations/set-agent-readiness-settings.ts";
import { setCacheRules } from "../operations/set-cache-rules.ts";
import { setRateLimitRules } from "../operations/set-rate-limit-rules.ts";
import { setSpeedSettings } from "../operations/set-speed-settings.ts";
import { setSslSettings } from "../operations/set-ssl-settings.ts";
import { setTransformRules } from "../operations/set-transform-rules.ts";
import { setWafRules } from "../operations/set-waf-rules.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { setCloudConnectorRules } from "../zone/cloud-connector.ts";
import { setEmailRouting } from "../zone/email-addresses.ts";
import { setDisabledWorkerRoutes } from "../zone/worker-routes.ts";
import { applyDns } from "./apply-dns.ts";
import { applyZoneStep } from "./apply-zone-step.ts";
import { reportHstsPreloadStatus } from "./report-hsts-preload-status.ts";
import type { ZoneApplyOptions } from "./zone-apply-options.ts";

/**
 * Applies every zone setting except the generated zone redirects, in order, printing a progress line per step.
 * With HSTS preload on it also prints where the domain stands on the preload list.
 */
export async function applyZoneConfig(
  client: CfClient,
  config: ZoneConfig,
  options: ZoneApplyOptions = {},
): Promise<void> {
  const log = options.log ?? stdoutLog;
  const { hsts } = config.ssl;

  const before: Array<[string, () => Promise<void>]> = [
    ["WAF", () => setWafRules(client, config)],
    ["Rate limits", () => setRateLimitRules(client, config)],
    ["Transforms", () => setTransformRules(client, config)],
    ["Cloud Connector", () => setCloudConnectorRules(client, config)],
    ["Worker routes (disabled)", () => setDisabledWorkerRoutes(client, config, log)],
    ["SSL/TLS", () => setSslSettings(client, config)],
  ];

  const after: Array<[string, () => Promise<void>]> = [
    ["Speed", () => setSpeedSettings(client, config)],
    ["Agent-readiness", () => setAgentReadinessSettings(client, config, log)],
    ["Cache", () => setCacheRules(client, config)],
    ["Email Routing", () => setEmailRouting(client, config)],
  ];

  await runInOrder(before, ([label, run]) => applyZoneStep(log, label, run));

  if (hsts.enabled && hsts.preload) await reportHstsPreloadStatus(log, config.domain, options.fetcher);

  await runInOrder(after, ([label, run]) => applyZoneStep(log, label, run));
  await applyDns(client, config, log);
}
