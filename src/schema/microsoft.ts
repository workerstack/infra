/**
 * Microsoft Entra (Azure AD) OAuth app — per env. Auto-provisioned via Graph API on apply.
 */
export type MicrosoftOAuthEnv = {
  /** Display name shown in Entra admin portal. */
  appName: string;
  /** Populated by runner on first provision. */
  clientId: string;
  /** Consumer-side only — not provisioned by infra. Store in your app secret manager. */
  clientSecret: string;
  /** Allowed redirect URIs. */
  redirectOrigins: string[];
  /**
   * Account types allowed to sign in.
   * - `AzureADMyOrg` — single-tenant (only your tenant).
   * - `AzureADMultipleOrgs` — any workplace/school account.
   * - `AzureADandPersonalMicrosoftAccount` — any MS account (work/school/personal).
   * - `PersonalMicrosoftAccount` — personal accounts only.
   */
  signInAudience?:
    | "AzureADandPersonalMicrosoftAccount"
    | "AzureADMultipleOrgs"
    | "AzureADMyOrg"
    | "PersonalMicrosoftAccount";
  /** Entra tenant ID (UUID) or `common` / `organizations` / `consumers` keyword. */
  tenantId: string;
};

/**
 * Top-level Microsoft provider config.
 */
export type MicrosoftConfig = {
  /**
   * Bearer token for Graph API with `Application.ReadWrite.All` scope. Used to auto-provision
   * the OAuth app on apply. Store in app secret manager.
   */
  graphApiToken: string;
  /** Per-env OAuth clients. */
  oauth?: Record<string, MicrosoftOAuthEnv>;
};
