import {
  type AnalyticsEngineDatasetBinding,
  bindings,
  type D1Binding,
  type KvBinding,
  type R2Binding,
} from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { LocalRemoteKind } from "../schema/workers.ts";
import type { CfKit } from "./cf-kit.ts";
import { each } from "./each.ts";
import type { KitContext } from "./kit-context.ts";
import { lookupBinding } from "./lookup-binding.ts";
import { requiredField } from "./required-field.ts";

type Storage = Pick<CfKit, "aiSearch" | "analytics" | "d1" | "kv" | "r2">;

// A kind the kit owns reads its remote resource in local, so every Worker sees one copy.
function remote(context: KitContext, scope: InfraScope, kind: LocalRemoteKind): { dev?: { remote: true } } {
  return scope === "local" && context.localRemote.has(kind) ? { dev: { remote: true } } : {};
}

type Lookup = { context: KitContext; name: string; scope: InfraScope };

function d1Of({ context, name, scope }: Lookup): D1Binding {
  const db = lookupBinding({ config: context.config, kind: "d1_databases", name, scope });
  const what = `${scope} d1_databases ${name}`;

  return bindings.d1({
    id: requiredField(db.database_id, `${what} database_id`),
    name: requiredField(db.database_name, `${what} database_name`),
    ...remote(context, scope, "d1_databases"),
  });
}

function r2Of({ context, name, scope }: Lookup): R2Binding {
  const bucket = lookupBinding({ config: context.config, kind: "r2_buckets", name, scope }).bucket_name;

  return bindings.r2({
    name: requiredField(bucket, `${scope} r2_buckets ${name} bucket_name`),
    ...remote(context, scope, "r2_buckets"),
  });
}

function kvOf({ context, name, scope }: Lookup): KvBinding {
  const { id } = lookupBinding({ config: context.config, kind: "kv_namespaces", name, scope });

  return bindings.kv({ id: requiredField(id, `${scope} kv_namespaces ${name} id`) });
}

function analyticsOf({ context, name, scope }: Lookup): AnalyticsEngineDatasetBinding {
  const { dataset } = lookupBinding({ config: context.config, kind: "analytics_engine_datasets", name, scope });

  return bindings.analyticsEngineDataset({
    name: requiredField(dataset, `${scope} analytics_engine_datasets ${name} dataset`),
  });
}

/**
 * The storage bindings a Worker reads: D1, KV, R2, analytics and AI Search, each resolved against the scope's
 * infra.
 */
export function storageBindings(context: KitContext): Storage {
  const { config } = context;

  return {
    aiSearch: (scope, ...names) =>
      each(names, (name) =>
        bindings.aiSearch({ name: lookupBinding({ config, kind: "ai_search", name, scope }).instance_name }),
      ),
    analytics: (scope, ...names) => each(names, (name) => analyticsOf({ context, name, scope })),
    d1: (scope, ...names) => each(names, (name) => d1Of({ context, name, scope })),
    kv: (scope, ...names) => each(names, (name) => kvOf({ context, name, scope })),
    r2: (scope, ...names) => each(names, (name) => r2Of({ context, name, scope })),
  };
}
