// This file imports only `.ts` files, so Node loads it without a bundler.
import type { WorkerConfig } from "@cloudflare/config";

import { buildKit } from "./cf-kit/build-kit.ts";
import type { KeysOf } from "./cf-kit/cf-kit-types.ts";
import type { CfKit } from "./cf-kit/cf-kit.ts";
import type { EnvBindings } from "./schema/bindings.ts";
import type { InfraConfig, InfraConfigInput, InfraEnv } from "./schema/infra.ts";
import type { LocalConfig } from "./schema/local-config.ts";
import { parseZoneConfig } from "./schema/zone.ts";

// One name under `.localhost` (`example.localhost`): a browser and the resolver send it to loopback,
// and its own subdomains (`api.example.localhost`) stay under it.
const LOCAL_HOST = /^[a-z0-9-]+\.localhost$/;

// The config, its bindings by name, and the kit typed to those names and the env's keys.
type Infra<B extends Record<string, EnvBindings>, V extends InfraEnv, D extends Partial<WorkerConfig>> = InfraConfig<
  B,
  V
> & { cloudflare?: { bindings: B } } & CfKit<KeysOf<B, V>, D>;

/**
 * A product's infra config and its kit in one value: what `infra.config.ts` default-exports and each Worker's
 * `cloudflare.config.ts` imports. Generic in the bindings, the env and the Workers' defaults, so binding names keep
 * their literal types and excess properties stay errors. `env` is kept by reference: no value of it is read here.
 */
export function defineInfraConfig<
  const B extends Record<string, EnvBindings>,
  const V extends InfraEnv,
  const D extends Partial<WorkerConfig> = Partial<WorkerConfig>,
>(input: InfraConfigInput<B, V, D>): Infra<B, V, D>;
export function defineInfraConfig(input: InfraConfigInput): InfraConfig & CfKit {
  const config = parsed(input);
  const kit = buildKit(config);

  return { ...config, ...kit };
}

function parsed(input: InfraConfigInput): InfraConfig {
  const result: InfraConfig = { env: input.env };

  if (input.cloudflare !== undefined) {
    result.cloudflare = {
      access: input.cloudflare.access,
      bindings: input.cloudflare.bindings ?? {},
      r2: input.cloudflare.r2,
      turnstile: input.cloudflare.turnstile,
      workers: input.cloudflare.workers,
      zone: parseZoneConfig(input.cloudflare.zone),
    };
  }

  if (input.google !== undefined) result.google = input.google;

  if (input.apple !== undefined) result.apple = input.apple;

  if (input.microsoft !== undefined) result.microsoft = input.microsoft;

  if (input.local !== undefined) result.local = checkedLocal(input.local);

  return result;
}

// A dir of `local.apps`: relative to the product root and inside it, listed once.
function checkApp(dir: string, apps: readonly string[]): void {
  if (dir === "") throw new Error("local.apps has an empty dir; name each app by its dir under the product root");

  if (dir.startsWith("/")) throw new Error(`local.apps dir ${dir} is absolute; name it relative to the product root`);

  if (dir.split("/").includes("..")) throw new Error(`local.apps dir ${dir} leaves the product root`);

  if (apps.indexOf(dir) !== apps.lastIndexOf(dir)) throw new Error(`local.apps names ${dir} twice`);
}

function checkedLocal(local: LocalConfig): LocalConfig {
  if (!LOCAL_HOST.test(local.host)) throw new Error(`local.host ${local.host} is not one name under .localhost`);

  for (const dir of local.apps ?? []) checkApp(dir, local.apps ?? []);

  return local;
}
