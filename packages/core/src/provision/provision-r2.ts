import type { CfClient } from "../api/client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { ensureR2CustomDomain } from "./ensure-r2-custom-domain.ts";
import type { ProvisionContext } from "./provision-context.ts";
import { findOrCreateR2, setR2Cors } from "./r2-bucket.ts";

type R2Binding = NonNullable<EnvBindings["r2_buckets"]>[string];

function attachDomains(client: CfClient, ctx: ProvisionContext, bucket: R2Binding): Promise<void> {
  const bucketName = bucket.bucket_name ?? "";

  return runInOrder(bucket.customDomains ?? [], async (domain) => {
    ctx.log(`    Domain "${domain}" ...`);

    const result = await ensureR2CustomDomain(client, ctx.accountId, { bucketName, domain, zoneId: ctx.zoneId });

    ctx.log(`    → ${result}`);
  });
}

/** Ensures one R2 bucket exists, then applies its CORS rules and custom domains. No id comes back to edit. */
export async function provisionR2(client: CfClient, ctx: ProvisionContext, bucket: R2Binding): Promise<void> {
  const name = bucket.bucket_name;

  if (name === undefined || name === "") return;

  ctx.log(`  [${ctx.env}] R2 "${name}" ...`);
  await findOrCreateR2(client, ctx.accountId, { locationHint: bucket.locationHint, name });
  ctx.log("    → exists");

  if (bucket.cors !== undefined) {
    ctx.log(`    CORS (${bucket.cors.length} rule${bucket.cors.length > 1 ? "s" : ""}) ...`);
    await setR2Cors(client, ctx.accountId, { bucketName: name, rules: bucket.cors });
    ctx.log("    → set");
  }

  await attachDomains(client, ctx, bucket);
}
