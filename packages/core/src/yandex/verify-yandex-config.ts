import { yandexSitemaps } from "./yandex-sitemaps.ts";
import type { YandexTarget } from "./yandex-target.ts";
import type { YandexVerifyResult } from "./yandex-verify-result.ts";

/** Finds the verified host and reports each configured sitemap as added or missing; adds nothing. */
export async function verifyYandexConfig(target: YandexTarget): Promise<YandexVerifyResult> {
  const { added, hostUrl } = await yandexSitemaps(target);
  const sitemaps = target.config.webmaster.sitemapUrls.map((url) => ({ added: added.has(url), url }));

  return { hostUrl, sitemaps };
}
