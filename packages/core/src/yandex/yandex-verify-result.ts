/** What `verifyYandexConfig` found: the verified host and whether each configured sitemap is added. */
export type YandexVerifyResult = { hostUrl: string; sitemaps: { added: boolean; url: string }[] };
