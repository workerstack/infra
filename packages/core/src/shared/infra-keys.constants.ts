/** Names a Worker reads as plain vars; their values come from the infra config or the account. */
export const INFRA_VAR_KEYS = [
  "CF_ACCOUNT_ID",
  "CF_ZONE_ID",
  "R2_ACCESS_KEY_ID",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "TURNSTILE_SITE_KEY",
] as const;

/** Credentials sealed in the env: a Worker grants them with `kit.secrets`, never `kit.vars`. */
export const INFRA_SEALED_KEYS = ["CF_API_TOKEN", "R2_SECRET_ACCESS_KEY", "TURNSTILE_SECRET_KEY"] as const;

/** A name a Worker reads as a plain var. */
export type InfraVarKey = (typeof INFRA_VAR_KEYS)[number];

/** A name of a credential sealed in the env. */
export type InfraSealedKey = (typeof INFRA_SEALED_KEYS)[number];

/** The env key holding the R2 S3 secret access key, per scope. */
export const R2_SECRET_KEY: InfraSealedKey = "R2_SECRET_ACCESS_KEY";
