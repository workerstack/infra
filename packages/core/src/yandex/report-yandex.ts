import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { YandexVerifyResult } from "./yandex-verify-result.ts";

/** Prints the Yandex check: the verified host, then each sitemap added or missing. */
export function reportYandex(result: YandexVerifyResult, log: Log = stdoutLog): void {
  log(`  Host ${result.hostUrl}: verified ✓`);

  if (result.sitemaps.length === 0) return;

  log("  Sitemaps:");

  for (const sitemap of result.sitemaps) log(`    ${sitemap.url}: ${sitemap.added ? "added ✓" : "missing ✗"}`);
}
