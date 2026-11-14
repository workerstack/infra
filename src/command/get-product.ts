import { reportApple } from "../apple/report-apple.ts";
import { requiredGlobal } from "../credentials.ts";
import { reportGoogle } from "../google/report-google.ts";
import { reportMicrosoft } from "../microsoft/report-microsoft.ts";
import type { Product } from "../products.ts";
import type { GetDeps } from "./get-deps.ts";

async function getCloudflareOf(deps: GetDeps, product: Product): Promise<void> {
  const { cloudflare, env } = product.config;

  if (cloudflare === undefined) return;

  const accountId = requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID");
  const client = deps.client(env, cloudflare.zone.zoneId);

  await deps.getCloudflare(client, { accountId, config: cloudflare, env, name: product.name }, deps.log);
}

/** One product's report: Cloudflare, then Google, Apple and Microsoft, each under its heading. */
export async function getProduct(deps: GetDeps, product: Product): Promise<void> {
  const { apple, env, google, microsoft } = product.config;
  const { log } = deps;

  await getCloudflareOf(deps, product);

  if (google !== undefined) {
    log(`\n Google: ${product.name}`);
    reportGoogle(await deps.verifyGoogle({ config: google, env }), log);
  }

  if (apple !== undefined) {
    log(`\n Apple: ${product.name}`);
    reportApple(await deps.verifyApple({ config: apple, env }), log);
  }

  if (microsoft !== undefined) {
    log(`\n Microsoft: ${product.name}`);
    reportMicrosoft(await deps.verifyMicrosoft({ config: microsoft, env }), log);
  }
}
