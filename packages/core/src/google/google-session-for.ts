import { requiredGlobal } from "../credentials.ts";
import type { GoogleSession } from "./google-session.ts";
import type { GoogleTarget } from "./google-target.ts";

/** The service account session for a target; throws when the global private key is missing. */
export function googleSessionFor(target: GoogleTarget, clientEmail: string): GoogleSession {
  return {
    clientEmail,
    fetcher: target.fetcher ?? fetch,
    privateKey: requiredGlobal(target.env, "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"),
  };
}
