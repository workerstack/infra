/**
 * IndexNow: on `infra set`, the URLs of each sitemap are pushed to `https://api.indexnow.org/indexnow`,
 * which shares them with Bing, Yandex and the other engines that take IndexNow.
 */
export type IndexNowConfig = {
  /** The host the URLs are on, e.g. `example.com`. Defaults to the zone domain. */
  host?: string;
  /**
   * The IndexNow key: 8 to 128 letters, digits and dashes. It is public: the product serves it as the
   * whole body of `https://{host}/{key}.txt`.
   */
  key: string;
  /** Absolute URLs of the sitemaps whose URLs are pushed; a sitemap index is followed one level down. */
  sitemapUrls: string[];
};
