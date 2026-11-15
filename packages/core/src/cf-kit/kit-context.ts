import type { InfraConfig } from "../schema/infra.ts";
import type { LocalRemoteKind } from "./cf-kit-types.ts";

/** What every part of the kit reads: the config, the kinds read remotely in local, and the registry file. */
export type KitContext = {
  config: InfraConfig;
  localRemote: ReadonlySet<LocalRemoteKind>;
  ratelimitIds: string;
};
