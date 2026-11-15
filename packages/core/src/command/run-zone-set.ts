import type { zoneRedirects } from "../redirects/zone-redirects.ts";
import type { applyZoneConfig } from "../runner/apply-zone-config.ts";
import type { ClientDeps } from "./client-deps.ts";
import { cloudflareOf } from "./cloudflare-of.ts";
import type { CommandHost } from "./command-host.ts";
import { runCommand } from "./run-command.ts";

/** The runner `infra zone-set` calls and where its redirect list comes from, swapped by a test. */
export type ZoneSetDeps = ClientDeps & { applyZoneConfig: typeof applyZoneConfig; zoneRedirects: typeof zoneRedirects };

/** `infra zone-set`: applies each picked product's zone settings, its generated redirect list included. */
export function runZoneSet(args: readonly string[], host: CommandHost, deps: ZoneSetDeps): Promise<number> {
  return runCommand(
    {
      done: "\n Zone configured. Run infra zone-get to verify.",
      name: "zone-set",
      work: async (product) => {
        const { zone } = cloudflareOf(product);

        const redirects = await deps.zoneRedirects(product.root, zone);

        deps.log(` Setting zone: ${product.name} (${zone.domain})`);
        await deps.applyZoneConfig(deps.client(product.config.env, zone.zoneId), zone, { log: deps.log, redirects });
      },
    },
    args,
    host,
  );
}
