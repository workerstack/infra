import type { CloudflareConfig } from "../../schema/cloudflare.ts";
import { zoneConfig } from "./zone-config.ts";

/** A parsed Cloudflare config for `example.com`: an empty bindings set unless `overrides` say otherwise. */
export function cloudflareConfig(overrides: Partial<CloudflareConfig> = {}): CloudflareConfig {
  return { bindings: {}, zone: zoneConfig(), ...overrides };
}
