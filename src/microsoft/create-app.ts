import { addAppPassword } from "./add-app-password.ts";
import type { AppInput } from "./app-input.ts";
import type { AppRegistration } from "./app-registration.ts";
import type { CreatedApp } from "./created-app.ts";
import type { GraphClient } from "./graph-client.ts";
import { graphRequest } from "./graph-request.ts";
import { GRAPH_RETRIES } from "./graph-retries.constants.ts";
import { GRAPH_RETRY_MS } from "./graph-retry-ms.constants.ts";
import { retryWithBackoff } from "./retry-with-backoff.ts";

/** Creates the app, its client secret when asked (retried while Entra propagates) and its service principal. */
export async function createApp(client: GraphClient, input: AppInput): Promise<CreatedApp> {
  const app = await graphRequest<AppRegistration>(client, {
    body: {
      displayName: input.appName,
      signInAudience: input.signInAudience,
      web: { redirectUris: input.redirectUris },
    },
    method: "POST",
    path: "/applications",
  });

  const clientSecret = input.withSecret
    ? await retryWithBackoff(() => addAppPassword(client, app.id), GRAPH_RETRIES, GRAPH_RETRY_MS)
    : undefined;

  try {
    await graphRequest(client, { body: { appId: app.appId }, method: "POST", path: "/servicePrincipals" });
  } catch (error) {
    // it may already exist when the app was partly provisioned before
    if (error instanceof Error && !error.message.includes("already exists")) throw error;
  }

  return { appId: app.appId, clientSecret, objectId: app.id };
}
