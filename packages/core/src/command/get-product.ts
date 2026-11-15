import { reportApple } from "../apple/report-apple.ts";
import { requiredGlobal } from "../credentials.ts";
import { reportGithub } from "../github/report-github.ts";
import { reportGoogle } from "../google/report-google.ts";
import { indexNowHost } from "../index-now/index-now-host.ts";
import { reportIndexNow } from "../index-now/report-index-now.ts";
import { reportMicrosoft } from "../microsoft/report-microsoft.ts";
import type { Product } from "../products.ts";
import { reportYandex } from "../yandex/report-yandex.ts";
import { yandexHostUrl } from "../yandex/yandex-host-url.ts";
import type { GetDeps } from "./get-deps.ts";

async function getCloudflareOf(deps: GetDeps, product: Product): Promise<void> {
  const { cloudflare, env } = product.config;

  if (cloudflare === undefined) return;

  const accountId = requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID");
  const client = deps.client(env, cloudflare.zone.zoneId);

  await deps.getCloudflare(client, { accountId, config: cloudflare, env, name: product.name }, deps.log);
}

async function getSitemapsOf(deps: GetDeps, product: Product): Promise<void> {
  const { config } = product;
  const { env, indexNow, yandex } = config;
  const { log } = deps;

  if (indexNow !== undefined) {
    log(`\n IndexNow: ${product.name}`);
    reportIndexNow(await deps.verifyIndexNow({ config: indexNow, host: indexNowHost(config) }), log);
  }

  if (yandex !== undefined) {
    log(`\n Yandex: ${product.name}`);
    reportYandex(await deps.verifyYandex({ config: yandex, env, hostUrl: yandexHostUrl(config) }), log);
  }
}

/**
 * One product's report: Cloudflare, then Google, Apple, Microsoft, GitHub, IndexNow and Yandex, each under its
 * heading.
 */
export async function getProduct(deps: GetDeps, product: Product): Promise<void> {
  const { apple, env, github, google, microsoft } = product.config;
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

  if (github !== undefined) {
    log(`\n GitHub: ${product.name}`);
    reportGithub(await deps.verifyGithub({ config: github, env }), log);
  }

  await getSitemapsOf(deps, product);
}
