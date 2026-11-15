import { yandexHostPath } from "./yandex-host-path.ts";
import { yandexJson } from "./yandex-json.ts";
import { yandexSessionFor } from "./yandex-session-for.ts";
import type { YandexSession } from "./yandex-session.ts";
import type { YandexTarget } from "./yandex-target.ts";

/** The target's session, its host's normalized URL, its sitemaps path and the sitemap URLs already added there. */
export async function yandexSitemaps(
  target: YandexTarget,
): Promise<{ added: Set<string>; hostUrl: string; path: string; session: YandexSession }> {
  const session = yandexSessionFor(target);
  const hostUrl = new URL(target.hostUrl).href;
  const path = `${await yandexHostPath(session, hostUrl)}/user-added-sitemaps`;
  const { sitemaps } = await yandexJson<{ sitemaps?: { sitemap_url: string }[] }>(session, path);

  return { added: new Set((sitemaps ?? []).map((sitemap) => sitemap.sitemap_url)), hostUrl, path, session };
}
