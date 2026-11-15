import { collectSitemapUrls } from "./collect-sitemap-urls.ts";
import type { IndexNowTarget } from "./index-now-target.ts";
import type { IndexNowVerifyResult } from "./index-now-verify-result.ts";
import { isKeyServed } from "./is-key-served.ts";
import { keyFileUrl } from "./key-file-url.ts";

/** Checks the key file and counts the sitemap URLs on the host; pushes nothing. */
export async function verifyIndexNowConfig(target: IndexNowTarget): Promise<IndexNowVerifyResult> {
  const keyServed = await isKeyServed(target);
  const urls = await collectSitemapUrls(target);

  return { keyFile: keyFileUrl(target), keyServed, urlCount: urls.length };
}
