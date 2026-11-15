import type { InfraScope } from "./infra.ts";

/**
 * One scope's GitHub sign-in app. GitHub has no API that creates an OAuth app, so `infra set` creates a
 * GitHub App by the manifest flow in the browser. The client secret is `GITHUB_CLIENT_SECRET` in the env
 * (per scope).
 */
export type GithubOAuthEnv = {
  /** The app's name on GitHub; its slug is this lowercased with dashes. */
  appName: string;
  /** `STUB` until `infra set` creates the app and writes its client id here. */
  clientId: string;
  /** The app's homepage URL. */
  homepageUrl: string;
  /** The organization that owns the app; the signed-in user's account when unset. */
  org?: string;
  /**
   * Whether accounts outside the owner can use the app; true when unset. GitHub lets only members of the owning
   * organization authorize a private app, so a sign-in app for the public stays public.
   */
  public?: boolean;
  /** The origins whose `/v1/auth/oauth/github/callback` is a callback URL. */
  redirectOrigins: string[];
};

/** Top-level GitHub provider config. */
export type GithubConfig = {
  /** Per-scope sign-in apps. */
  oauth?: Partial<Record<InfraScope, GithubOAuthEnv>>;
};
