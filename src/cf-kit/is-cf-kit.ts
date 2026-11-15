import { CF_KIT } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";

/** Whether a module export is a kit: what `infra gen` uses to find a product's kit. */
export function isCfKit(value: unknown): value is CfKit {
  return typeof value === "object" && value !== null && CF_KIT in value;
}
