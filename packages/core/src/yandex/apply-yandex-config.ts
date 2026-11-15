import { runInOrder } from "../shared/run-in-order.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { yandexJson } from "./yandex-json.ts";
import { yandexSitemaps } from "./yandex-sitemaps.ts";
import type { YandexTarget } from "./yandex-target.ts";

/** Finds the verified host, then adds each configured sitemap it does not have yet. */
export async function applyYandexConfig(target: YandexTarget): Promise<void> {
  const log = target.log ?? stdoutLog;
  const { added, hostUrl, path, session } = await yandexSitemaps(target);

  log(`  Host ${hostUrl}: verified`);

  await runInOrder(target.config.webmaster.sitemapUrls, async (url) => {
    if (added.has(url)) {
      log(`  Sitemap "${url}" → already added`);

      return;
    }

    await yandexJson(session, path, { url });
    log(`  Sitemap "${url}" → added`);
  });
}
