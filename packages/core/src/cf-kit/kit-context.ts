import type { InfraConfig } from "../schema/infra.ts";
import type { LocalRemoteKind } from "../schema/workers.ts";
import type { EnvKeyRef } from "./cf-kit-types.ts";

/** What every part of the kit reads: the config and the kinds read remotely in local. */
export type KitContext = {
  config: InfraConfig;
  /** The map every pick reads its keys off. */
  keys: Record<string, EnvKeyRef>;
  localRemote: ReadonlySet<LocalRemoteKind>;
};
