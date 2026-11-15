import { stdoutLog } from "../shared/stdout-log.ts";
import { collectSitemapUrls } from "./collect-sitemap-urls.ts";
import type { IndexNowTarget } from "./index-now-target.ts";
import { isKeyServed } from "./is-key-served.ts";
import { keyFileUrl } from "./key-file-url.ts";
import { pushIndexNow } from "./push-index-now.ts";

/** Checks the key file, then pushes every sitemap URL on the host to IndexNow. */
export async function applyIndexNowConfig(target: IndexNowTarget): Promise<void> {
  const log = target.log ?? stdoutLog;
  const keyFile = keyFileUrl(target);

  if (!(await isKeyServed(target)))
    throw new Error(`indexNow: ${keyFile} does not serve the key; serve a file there that holds it`);

  log(`  Key file ${keyFile}: served`);

  const urls = await collectSitemapUrls(target);

  log(`  Sitemaps: ${String(urls.length)} URLs on ${target.host}`);
  await pushIndexNow(target, urls);
}
