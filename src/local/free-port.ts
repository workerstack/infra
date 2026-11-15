import { tryBind } from "./try-bind.ts";

/**
 * A port free on every address right now. Each port a child is given is passed explicitly, so the child fails loud
 * (`--strictPort`) in the rare case another process takes it first.
 */
export async function freePort(): Promise<number> {
  const bound = await tryBind(0);

  if ("code" in bound) throw new Error(`no free port to bind (${bound.code})`);

  return bound.port;
}
