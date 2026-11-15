import { requiredGlobal } from "../credentials.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { MicrosoftOAuthEnv } from "../schema/microsoft.ts";
import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { STUB } from "../shared/stub.constants.ts";
import type { AppRegistration } from "./app-registration.ts";
import { DEFAULT_SIGN_IN_AUDIENCE } from "./default-sign-in-audience.constants.ts";
import { getApp } from "./get-app.ts";
import type { MicrosoftTarget } from "./microsoft-target.ts";
import type { MicrosoftVerifyResult } from "./microsoft-verify-result.ts";

type Entry = MicrosoftVerifyResult["oauth"][number];

/** Checks each scope's app exists in Entra; with no graph token, only reports the config. */
export async function verifyMicrosoftConfig(target: MicrosoftTarget): Promise<MicrosoftVerifyResult> {
  const result: MicrosoftVerifyResult = { oauth: [] };
  const hasToken = (target.env.global.MICROSOFT_GRAPH_API_TOKEN ?? "") !== "";

  await runInOrder([...INFRA_SCOPES], async (scope) => {
    const oauth = target.config.oauth?.[scope];

    if (oauth === undefined) return;

    const entry = configEntry(scope, oauth);

    if (!hasToken || oauth.clientId === "" || oauth.clientId === STUB) {
      result.oauth.push(entry);

      return;
    }

    result.oauth.push(await lookedUp(target, oauth, entry));
  });

  return result;
}

function configEntry(scope: InfraScope, oauth: MicrosoftOAuthEnv): Entry {
  return {
    appName: oauth.appName,
    env: scope,
    exists: false,
    redirectUris: oauth.redirectOrigins,
    secretCount: 0,
    signInAudience: oauth.signInAudience ?? DEFAULT_SIGN_IN_AUDIENCE,
  };
}

async function lookedUp(target: MicrosoftTarget, oauth: MicrosoftOAuthEnv, entry: Entry): Promise<Entry> {
  const token = requiredGlobal(target.env, "MICROSOFT_GRAPH_API_TOKEN");
  const app = await getApp({ fetcher: target.fetcher ?? fetch, token }, oauth.clientId);

  return { ...entry, ...appFields(app, oauth) };
}

function appFields(app: AppRegistration | undefined, oauth: MicrosoftOAuthEnv): Partial<Entry> {
  return {
    exists: app !== undefined,
    redirectUris: app?.web?.redirectUris ?? oauth.redirectOrigins,
    secretCount: app?.passwordCredentials?.length ?? 0,
    signInAudience: app?.signInAudience ?? oauth.signInAudience ?? "unknown",
  };
}
