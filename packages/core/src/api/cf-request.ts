import { CF_API } from "./cf-api.constants.ts";
import { errorMessages, readEnvelope } from "./cf-envelope.ts";
import type { CfFetch } from "./cf-fetch.ts";

/** A JSON request body: an object or an array. */
export type CfBody = object;

export type CfCall = {
  body?: CfBody | undefined;
  headers: Record<string, string>;
  /** The error line's prefix, such as `CF API`. */
  label: string;
  method: string;
  path: string;
};

/** Sends one call and returns the result. A failed envelope throws `${label} ${method} ${path}: ${messages}`. */
export async function cfRequest<T>(call: CfCall, fetcher: CfFetch): Promise<T> {
  const { body, headers, label, method, path } = call;
  const init: RequestInit = { headers, method };

  if (body !== undefined) init.body = JSON.stringify(body);

  const envelope = await readEnvelope(await fetcher(`${CF_API}${path}`, init));

  if (!envelope.success) throw new Error(`${label} ${method} ${path}: ${errorMessages(envelope)}`);

  // The envelope's result is unknown; the caller names the shape the endpoint returns.
  return envelope.result /* the endpoint's documented result shape */ as T;
}
