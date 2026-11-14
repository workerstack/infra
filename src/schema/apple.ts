/**
 * Apple Sign in with Apple OAuth config — per env.
 * infra does not provision at Apple Developer Portal; this describes consumer-side wiring.
 * The PEM private key (.p8 contents) is `APPLE_PRIVATE_KEY` in the env (per scope).
 */
export type AppleOAuthEnv = {
  /**
   * Apple-issued Key ID (10-char). Created at Apple Developer → Certificates, IDs & Profiles
   * → Keys → create a new key with "Sign In with Apple" enabled. Shown once at creation
   * alongside the .p8 file download (Apple won't let you re-download the key material later).
   */
  keyId: string;
  /** Allowed redirect URIs; must match Apple Developer Portal "Return URLs" exactly. */
  redirectOrigins: string[];
  /**
   * Apple Services ID (reverse-DNS form, e.g. `com.example.auth`). Acts as the OAuth
   * `client_id`. Created at Apple Developer → Identifiers → Services IDs, separate from
   * the App ID used for iOS bundles. Must have "Sign In with Apple" capability enabled.
   */
  serviceId: string;
  /**
   * Apple Team ID (10-char). Shown in the top-right of any Apple Developer Portal page,
   * and in Membership Details. Same across every Services ID and Key for the team.
   */
  teamId: string;
};

/**
 * Top-level Apple provider config.
 */
export type AppleConfig = {
  /** Per-env Sign in with Apple clients. */
  oauth?: Record<string, AppleOAuthEnv>;
};
