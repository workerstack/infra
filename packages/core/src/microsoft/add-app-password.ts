import type { GraphClient } from "./graph-client.ts";
import { graphRequest } from "./graph-request.ts";

/** Adds a client secret to the app (old ones stay valid) and returns its text. */
export async function addAppPassword(client: GraphClient, objectId: string): Promise<string> {
  const secret = await graphRequest<{ secretText: string }>(client, {
    body: { passwordCredential: { displayName: `infra-${Date.now()}` } },
    method: "POST",
    path: `/applications/${objectId}/addPassword`,
  });

  return secret.secretText;
}
