import type { InfraScope } from "./infra.ts";

/**
 * Microsoft Entra (Azure AD) OAuth app — per env. Auto-provisioned via Graph API on apply.
 * The client secret is `MICROSOFT_CLIENT_SECRET` in the env (per scope).
 */
export type MicrosoftOAuthEnv = {
  /** Display name shown in Entra admin portal. */
  appName: string;
  /** Populated by runner on first provision. */
  clientId: string;
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
 * Top-level Microsoft provider config. The Graph API bearer token (`Application.ReadWrite.All`,
 * used to auto-provision the OAuth app) is `MICROSOFT_GRAPH_API_TOKEN` in the env (global).
 */
export type MicrosoftConfig = {
  /** Per-scope OAuth clients. */
  oauth?: Partial<Record<InfraScope, MicrosoftOAuthEnv>>;
};
