/**
 * Cloudflare Turnstile widget config — per env, auto-provisioned via CF v4 API.
 */
export type CloudflareTurnstileEnv = {
  /**
   * Bot-score threshold required to earn a clearance cookie.
   * - `interactive` — require explicit challenge.
   * - `jschallenge` — silent JS check.
   * - `managed` — CF decides (default).
   * - `no_clearance` — never issue a clearance cookie.
   */
  clearanceLevel?: "interactive" | "jschallenge" | "managed" | "no_clearance";
  /**
   * Origins allowed to render this widget. Exact hostname match only — subdomains are NOT
   * inherited. If you serve on `example.com`, `www.example.com`, and `app.example.com`, list all
   * three. No wildcards. Widget renders a CF error on mismatched origins (good for catching
   * misconfig in staging early).
   */
  domains: string[];
  /**
   * Widget UX mode.
   * - `invisible` — no UI, silent challenge.
   * - `managed` — CF chooses visible/invisible per request.
   * - `non-interactive` — shows a loading checkbox but no human action required.
   */
  mode: "invisible" | "managed" | "non-interactive";
  /** Human-readable name shown in CF dashboard. */
  name: string;
  /**
   * Server-side secret for verifying client-submitted tokens against
   * `challenges.cloudflare.com/turnstile/v0/siteverify`. Never ship to the browser —
   * store in app secret manager and keep out of client bundles.
   */
  secretKey: string;
  /**
   * Public key safely embedded in the client widget (`<div data-sitekey="...">`).
   * Tied to `domains` — a leaked siteKey only works from allowed origins.
   */
  siteKey: string;
};

/**
 * Single Google SSO identity provider — the one human auth path per env.
 */
export type CloudflareAccessGoogleIdP = {
  /** Google OAuth 2.0 client ID from console.cloud.google.com. */
  clientId: string;
  /** Consumer-side only — not provisioned by infra. Store in your app secret manager. */
  clientSecret: string;
};

/**
 * Single CF Access service token per env — the one backend auth path. Generated once
 * by the runner on first `set` and written back to the config; rotate via CF dashboard.
 */
export type CloudflareAccessServiceToken = {
  /** `"STUB"` on first run, populated by runner. */
  clientId: string;
  /** `"STUB"` on first run, populated by runner. */
  clientSecret: string;
  /** Human-readable, unique per CF account. */
  name: string;
};

/**
 * CF Access application — one per protected URL surface. Wraps an origin with CF's
 * zero-trust policy layer (Google SSO for humans, service token for machines).
 */
export type CloudflareAccessApplication = {
  /** Emails permitted via Google SSO. Empty = machine-only (service token only). */
  allowEmails: string[];
  /** Apex domain for self-hosted app, e.g. `"example.com"`. */
  domain: string;
  /** Human-readable name shown in CF dashboard. */
  name: string;
  /**
   * Path patterns protected by this app. CF treats `*` as "match any characters including
   * `/`" — so `/admin/*` matches `/admin/x`, `/admin/x/y/z`, and `/admin` itself via the
   * implicit trailing match. To protect ONLY the exact `/admin` path, list it without the
   * trailing `*`. Patterns are joined with OR (any one match is enough to gate).
   *
   * Overlap behavior: if two Access apps cover the same path, the first one created at CF
   * wins — infra does not reconcile overlaps. Keep patterns disjoint.
   */
  paths: string[];
  /** Session duration in hours. Default 8 (CF sends as `"8h"`). */
  sessionDurationHours?: number;
};

/**
 * Full CF Access config for one environment.
 */
export type CloudflareAccessEnv = {
  /** Protected URL surfaces keyed by app identifier. */
  applications?: Record<string, CloudflareAccessApplication>;
  /** Google SSO IdP for human access. */
  google: CloudflareAccessGoogleIdP;
  /** Service token for machine access. */
  serviceToken: CloudflareAccessServiceToken;
};

/**
 * R2 S3-compatible credentials. Required when you hit R2 directly (not via binding) —
 * e.g. from a non-worker backup job.
 */
export type CloudflareR2Credentials = {
  /** R2 access key ID. */
  accessKeyId: string;
  /** S3 endpoint URL, shape `https://{accountId}.r2.cloudflarestorage.com`. */
  endpoint: string;
  /** R2 secret access key. Store in app secret manager. */
  secretAccessKey: string;
};
