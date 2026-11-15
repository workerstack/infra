import type { InfraConfig } from "../schema/infra.ts";
import type { LocalRemoteKind } from "../schema/workers.ts";

/** What every part of the kit reads: the config and the kinds read remotely in local. */
export type KitContext = {
  config: InfraConfig;
  localRemote: ReadonlySet<LocalRemoteKind>;
};
