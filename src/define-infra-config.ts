// This file imports only `.ts` files, so Node loads it without a bundler.
import type { InfraConfig, InfraConfigInput } from "./schema/infra.ts";
import type { LocalConfig } from "./schema/local-config.ts";
import { parseZoneConfig } from "./schema/zone.ts";

// One name under `.localhost` (`example.localhost`): a browser and the resolver send it to loopback,
// and its own subdomains (`api.example.localhost`) stay under it.
const LOCAL_HOST = /^[a-z0-9-]+\.localhost$/;

// Generic so `cloudflare.bindings` keeps its binding names: an `infra.config.ts` autocompletes them.
export function defineInfraConfig<const T extends InfraConfigInput>(
  input: T,
): InfraConfig & {
  cloudflare?: { bindings: NonNullable<NonNullable<T["cloudflare"]>["bindings"]> };
} {
  const result: InfraConfig & {
    cloudflare?: { bindings: NonNullable<NonNullable<T["cloudflare"]>["bindings"]> };
  } = {};

  if (input.cloudflare !== undefined) {
    result.cloudflare = {
      access: input.cloudflare.access,
      accountEmail: input.cloudflare.accountEmail,
      accountId: input.cloudflare.accountId,
      bindings: input.cloudflare.bindings ?? {},
      globalApiKey: input.cloudflare.globalApiKey,
      masterApiToken: input.cloudflare.masterApiToken,
      r2: input.cloudflare.r2,
      turnstile: input.cloudflare.turnstile,
      workerApiToken: input.cloudflare.workerApiToken,
      zone: parseZoneConfig(input.cloudflare.zone),
    };
  }

  if (input.google !== undefined) result.google = input.google;

  if (input.apple !== undefined) result.apple = input.apple;

  if (input.microsoft !== undefined) result.microsoft = input.microsoft;

  if (input.local !== undefined) result.local = checkedLocal(input.local);

  return result;
}

function checkedLocal(local: LocalConfig): LocalConfig {
  if (!LOCAL_HOST.test(local.host)) throw new Error(`local.host ${local.host} is not one name under .localhost`);

  return local;
}
