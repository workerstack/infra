import type { CfClient } from "../api/client.ts";
import type { CloudConnectorRule } from "../schema/edge-rules.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { CLOUD_CONNECTOR_DEFAULT_PROVIDER } from "./cloud-connector-default-provider.constants.ts";

type CfCloudConnectorRule = {
  description?: string;
  enabled?: boolean;
  expression?: string;
  parameters?: { host?: string };
  provider?: CloudConnectorRule["provider"];
};

/**
 * Full-replace PUT; an empty array clears drift. Cloud Connector is its own
 * resource (not a rulesets phase), and the body is a raw array.
 */
export async function setCloudConnectorRules(client: CfClient, config: ZoneConfig): Promise<void> {
  const rules: CfCloudConnectorRule[] = config.cloudConnectors.map((rule) => ({
    description: rule.description,
    enabled: rule.enabled,
    expression: rule.expression,
    parameters: { host: rule.host },
    provider: rule.provider,
  }));

  await client.request<CfCloudConnectorRule[]>("PUT", `/zones/${client.zoneId}/cloud_connector/rules`, rules);
}

/**
 * Reads live rules in the declared-config shape: `parameters.host` becomes
 * `host`, `id` is dropped and schema defaults fill omitted fields, so small
 * response differences do not look like drift.
 */
export async function getCloudConnectorRules(client: CfClient): Promise<CloudConnectorRule[]> {
  const live = await client.request<CfCloudConnectorRule[]>("GET", `/zones/${client.zoneId}/cloud_connector/rules`);

  return live.map((rule) => ({
    description: rule.description ?? "",
    enabled: rule.enabled ?? true,
    expression: rule.expression ?? "",
    host: rule.parameters?.host ?? "",
    provider: rule.provider ?? CLOUD_CONNECTOR_DEFAULT_PROVIDER,
  }));
}
