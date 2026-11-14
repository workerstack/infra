import type { AppRegistration } from "./app-registration.ts";
import type { GraphClient } from "./graph-client.ts";
import { graphRequest } from "./graph-request.ts";

/** The app registration with this client id, or undefined when Graph has none or fails. */
export async function getApp(client: GraphClient, appId: string): Promise<AppRegistration | undefined> {
  const select = "id,appId,displayName,web,signInAudience,passwordCredentials";

  try {
    const result = await graphRequest<{ value: AppRegistration[] }>(client, {
      method: "GET",
      path: `/applications?$filter=appId eq '${appId}'&$select=${select}`,
    });

    return result.value[0];
  } catch {
    return undefined;
  }
}
