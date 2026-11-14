import { addAppPassword } from "./add-app-password.ts";
import type { AppInput } from "./app-input.ts";
import type { AppRegistration } from "./app-registration.ts";
import { APP_SELECT } from "./app-select.constants.ts";
import { createApp } from "./create-app.ts";
import type { CreatedApp } from "./created-app.ts";
import type { GraphClient } from "./graph-client.ts";
import { graphRequest } from "./graph-request.ts";

/**
 * Finds the app by display name and refreshes it, or creates it. It gets a new client secret only when
 * `input.withSecret`.
 */
export async function findOrCreateApp(client: GraphClient, input: AppInput): Promise<CreatedApp> {
  const name = encodeURIComponent(input.appName);

  const existing = await graphRequest<{ value: AppRegistration[] }>(client, {
    method: "GET",
    path: `/applications?$filter=displayName eq '${name}'&${APP_SELECT}`,
  });

  const match = existing.value.find((app) => app.displayName === input.appName);

  if (match === undefined) return createApp(client, input);

  await graphRequest(client, {
    body: { signInAudience: input.signInAudience, web: { redirectUris: input.redirectUris } },
    method: "PATCH",
    path: `/applications/${match.id}`,
  });

  return {
    appId: match.appId,
    clientSecret: input.withSecret ? await addAppPassword(client, match.id) : undefined,
    objectId: match.id,
  };
}
