import { GRAPH_API } from "./graph-api.constants.ts";
import type { GraphCall } from "./graph-call.ts";
import type { GraphClient } from "./graph-client.ts";

/** One Graph call; a failure throws `Graph API <method> <path>: <message>`. */
export async function graphRequest<T>(client: GraphClient, call: GraphCall): Promise<T> {
  const init: RequestInit = {
    headers: { Authorization: `Bearer ${client.token}`, "Content-Type": "application/json" },
    method: call.method,
  };

  if (call.body !== undefined) init.body = JSON.stringify(call.body);

  const response = await client.fetcher(`${GRAPH_API}${call.path}`, init);
  const json = (await response.json()) /* Graph's JSON or its error envelope */ as { error?: { message?: string } };

  if (!response.ok)
    throw new Error(`Graph API ${call.method} ${call.path}: ${json.error?.message ?? response.statusText}`);

  return json /* the caller names the shape the endpoint returns */ as T;
}
