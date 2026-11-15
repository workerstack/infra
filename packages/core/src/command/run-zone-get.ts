import { requiredGlobal } from "../credentials.ts";
import type { zoneGet } from "../runner/zone-get.ts";
import type { ClientDeps } from "./client-deps.ts";
import { cloudflareOf } from "./cloudflare-of.ts";
import type { CommandHost } from "./command-host.ts";
import { runCommand } from "./run-command.ts";

/** The runner `infra zone-get` calls, swapped by a test. */
export type ZoneGetDeps = ClientDeps & { zoneGet: typeof zoneGet };

/** `infra zone-get`: reports each picked product's zone; a product with no zone fails. */
export function runZoneGet(args: readonly string[], host: CommandHost, deps: ZoneGetDeps): Promise<number> {
  return runCommand(
    {
      done: "\n Verification complete.",
      name: "zone-get",
      work: async (product) => {
        const config = cloudflareOf(product);
        const { env } = product.config;
        const accountId = requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID");

        await deps.zoneGet(
          deps.client(env, config.zone.zoneId),
          { accountId, config, env, name: product.name },
          deps.log,
        );
      },
    },
    args,
    host,
  );
}
