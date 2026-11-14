import { runInOrder } from "../shared/run-in-order.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { applyGoogleOauth } from "./apply-google-oauth.ts";
import { googleSessionFor } from "./google-session-for.ts";
import type { GoogleTarget } from "./google-target.ts";
import { submitSitemap } from "./submit-sitemap.ts";

/** Prints the OAuth wiring and submits each Search Console sitemap. */
export async function applyGoogleConfig(target: GoogleTarget): Promise<void> {
  const log = target.log ?? stdoutLog;

  applyGoogleOauth(target.config, log);

  const sc = target.config.searchConsole;

  if (sc === undefined) return;

  if (sc.serviceAccountEmail === "") {
    log("  Search Console: (credentials empty, skipping)");

    return;
  }

  const session = googleSessionFor(target, sc.serviceAccountEmail);

  await runInOrder(sc.sitemapUrls, async (sitemapUrl) => {
    log(`  Sitemap "${sitemapUrl}" ...`);

    const result = await submitSitemap(session, sc.siteUrl, sitemapUrl);

    log(`    → ${result.ok ? "submitted" : (result.error ?? "failed")}`);
  });
}
