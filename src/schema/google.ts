/**
 * Google OAuth 2.0 client — per env. infra does not provision the OAuth client itself
 * (Google Cloud Console only); this config describes consumer-side wiring.
 */
export type GoogleOAuthEnv = {
  /** OAuth authorization endpoint, typically `https://accounts.google.com/o/oauth2/v2/auth`. */
  authBaseUrl: string;
  /** Google OAuth client ID. */
  clientId: string;
  /** Consumer-side only — not provisioned by infra. Store in your app secret manager. */
  clientSecret: string;
  /** Allowed redirect URIs; MUST match exactly what's registered in Google Cloud Console. */
  redirectOrigins: string[];
};

/**
 * Google Search Console programmatic access — service account + sitemap list.
 * Used by infra to submit sitemaps + read impression data.
 */
export type GoogleSearchConsole = {
  /** Google Cloud service account email, form `name@project.iam.gserviceaccount.com`. */
  serviceAccountEmail: string;
  /**
   * PEM-formatted private key for the service account (begins `-----BEGIN PRIVATE KEY-----`).
   * Store in app secret manager. In a .env file, escape newlines as `\n`.
   */
  serviceAccountPrivateKey: string;
  /**
   * Absolute URLs of sitemap XMLs to (re)submit on apply, e.g.
   * `["https://example.com/sitemap.xml", "https://example.com/blog/sitemap.xml"]`.
   * Resubmitting does not trigger immediate recrawl — it just updates the lastmod hint.
   */
  sitemapUrls: string[];
  /**
   * Canonical site URL as registered in Search Console. Must be the EXACT verification
   * form — either `https://example.com/` (URL-prefix property) or `sc-domain:example.com`
   * (Domain property). Different properties for www vs apex count as separate.
   */
  siteUrl: string;
};

/**
 * Top-level Google provider config.
 */
export type GoogleConfig = {
  /** Per-env OAuth clients. */
  oauth?: Record<string, GoogleOAuthEnv>;
  /** Search Console programmatic access. */
  searchConsole?: GoogleSearchConsole;
};
