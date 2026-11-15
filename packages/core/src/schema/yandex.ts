/**
 * Yandex Webmaster sitemaps. The OAuth token is `YANDEX_WEBMASTER_TOKEN` in the env (global).
 */
export type YandexWebmaster = {
  /** The host as Yandex Webmaster lists it, e.g. `https://example.com`. Defaults to `https://{zone domain}`. */
  hostUrl?: string;
  /** Absolute URLs of the sitemaps `infra set` adds to the host when they are missing. */
  sitemapUrls: string[];
};

/**
 * Top-level Yandex provider config.
 */
export type YandexConfig = {
  /** Yandex Webmaster sitemaps. */
  webmaster: YandexWebmaster;
};
