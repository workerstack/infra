import type { Provisioned } from "../provision/provisioned.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { MicrosoftOAuthEnv } from "../schema/microsoft.ts";
import type { Log } from "../shared/log.ts";
import { maskSecret } from "../shared/mask-secret.ts";
import { STUB } from "../shared/stub.constants.ts";
import { clientIdEdit } from "./client-id-edit.ts";
import { DEFAULT_SIGN_IN_AUDIENCE } from "./default-sign-in-audience.constants.ts";
import { findOrCreateApp } from "./find-or-create-app.ts";
import type { GraphClient } from "./graph-client.ts";

/** What one scope's app needs to be provisioned and where the results go. */
export type MicrosoftScopeRun = {
  client: GraphClient;
  hasSecret: boolean;
  log: Log;
  oauth: MicrosoftOAuthEnv;
  out: Provisioned;
  scope: InfraScope;
};

/** Provisions one scope's app; a new id becomes an edit, a new secret a write when the scope lacks one. */
export async function applyMicrosoftScope(run: MicrosoftScopeRun): Promise<void> {
  const { client, hasSecret, log, oauth, out, scope } = run;

  log(`    [${scope}] "${oauth.appName}" ...`);

  const result = await findOrCreateApp(client, {
    appName: oauth.appName,
    redirectUris: oauth.redirectOrigins.map((origin) => `${origin}/v1/auth/oauth/microsoft/callback`),
    signInAudience: oauth.signInAudience ?? DEFAULT_SIGN_IN_AUDIENCE,
    withSecret: !hasSecret,
  });

  log(`    → clientId: ${result.appId}`);

  if (result.clientSecret !== undefined) log(`    → secret: ${maskSecret(result.clientSecret)}`);

  if (oauth.clientId === STUB) out.edits.push(clientIdEdit(oauth.appName, result.appId));

  if (result.clientSecret !== undefined)
    out.secrets.push({ key: "MICROSOFT_CLIENT_SECRET", scope, value: result.clientSecret });
}
