import { requiredGlobal } from "../credentials.ts";
import type { Product } from "../products.ts";
import type { Provisioned } from "../provision/provisioned.ts";
import { cloudflareOf } from "./cloudflare-of.ts";
import type { SetDeps } from "./set-deps.ts";

/** Where `setCloudflare` is: the repo root (for wrangler) and what has been provisioned so far. */
export type SetRun = { out: Provisioned; root: string };

function collect(out: Provisioned, more: Provisioned): void {
  out.edits.push(...more.edits);
  out.secrets.push(...more.secrets);
}

/** Provisions the bindings, Access and AI Search, then applies the zone; ids and secrets collect in `run.out`. */
export async function setCloudflare(deps: SetDeps, product: Product, run: SetRun): Promise<void> {
  const config = cloudflareOf(product);
  const { env } = product.config;
  const { log } = deps;
  const accountId = requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID");
  const client = deps.client(env, config.zone.zoneId);
  const { bindings, turnstile, zone } = config;

  log(`\n Cloudflare: ${product.name} (account: ${accountId})`);
  collect(
    run.out,
    await deps.provisionBindings(client, { accountId, bindings, env, turnstile, zoneId: zone.zoneId }, log),
  );

  if (config.access !== undefined) {
    log(`\n Provisioning Access: ${product.name}`);
    collect(run.out, await deps.provisionAccess(client, { access: config.access, accountId, env }, log));
  }

  await deps.provisionAiSearch({ accountId, bindings, env, root: run.root }, log);

  log(` Setting zone: ${product.name} (${zone.domain})`);
  await deps.applyZoneConfig(client, zone, { log });
  log(" Done: Cloudflare");
}
