import { requiredGlobal } from "../credentials.ts";
import type { Provisioned } from "../provision/provisioned.ts";
import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { applyMicrosoftScope } from "./apply-microsoft-scope.ts";
import type { MicrosoftTarget } from "./microsoft-target.ts";

/** Provisions each scope's Entra app; returns the config edits for new ids and the secrets to write. */
export async function applyMicrosoftConfig(target: MicrosoftTarget): Promise<Provisioned> {
  const out: Provisioned = { edits: [], secrets: [] };
  const log = target.log ?? stdoutLog;

  if (target.config.oauth === undefined) return out;

  const client = { fetcher: target.fetcher ?? fetch, token: requiredGlobal(target.env, "MICROSOFT_GRAPH_API_TOKEN") };

  log("  OAuth:");

  await runInOrder([...INFRA_SCOPES], async (scope) => {
    const oauth = target.config.oauth?.[scope];

    if (oauth === undefined) return;

    const hasSecret = (target.env[scope].MICROSOFT_CLIENT_SECRET ?? "") !== "";

    await applyMicrosoftScope({ client, hasSecret, log, oauth, out, scope });
  });

  return out;
}
