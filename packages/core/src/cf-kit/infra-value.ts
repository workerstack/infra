import type { InfraConfig, InfraScope } from "../schema/infra.ts";
import type { InfraVarKey } from "../shared/infra-keys.constants.ts";
import { ACCOUNT_ID_GLOBAL_KEY } from "./cf-kit.constants.ts";

type InfraLookup = { config: InfraConfig; key: InfraVarKey; scope: InfraScope };

// The scope's turnstile widget, else the dev one: a scope with no widget of its own shares it.
function siteKey({ config, scope }: Pick<InfraLookup, "config" | "scope">): string | undefined {
  const widgets = config.cloudflare?.turnstile;

  return (widgets?.[scope] ?? widgets?.dev)?.siteKey;
}

// `R2_BUCKET_NAME` is the scope's one R2 bucket, so it is resolved with the bindings.
function bucketName({ config, scope }: Pick<InfraLookup, "config" | "scope">): string | undefined {
  const buckets = Object.values(config.cloudflare?.bindings[scope]?.r2_buckets ?? {});

  return buckets.length === 1 ? buckets[0]?.bucket_name : undefined;
}

/**
 * The value infra gives a var a Worker reads, from the config or the env's global account id; undefined when it
 * has none.
 */
export function infraValue(lookup: InfraLookup): string | undefined {
  const { config, key } = lookup;

  // A thunk per key: only the asked-for value is read from the env.
  const values: Record<InfraVarKey, () => string | undefined> = {
    CF_ACCOUNT_ID: () => config.env.global[ACCOUNT_ID_GLOBAL_KEY],
    CF_ZONE_ID: () => config.cloudflare?.zone.zoneId,
    R2_ACCESS_KEY_ID: () => config.cloudflare?.r2?.accessKeyId,
    R2_BUCKET_NAME: () => bucketName(lookup),
    R2_ENDPOINT: () => config.cloudflare?.r2?.endpoint,
    TURNSTILE_SITE_KEY: () => siteKey(lookup),
  };

  return values[key]();
}
