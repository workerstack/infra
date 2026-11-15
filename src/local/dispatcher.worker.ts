import * as z from "zod";

import { NOT_FOUND, WORKER_HEADER } from "./local.constants.ts";

/** A service binding, typed narrowly so this checks under bun-types with no Worker types in the package. */
type Service = { fetch: (request: Request) => Promise<Response> };

/** `TARGETS` maps each Worker's name to its binding, as `writeDispatcher` wrote it; the rest are the bindings. */
type DispatcherEnv = { [binding: string]: Service | string; TARGETS: string };

function targetsSchema(): z.ZodType<Record<string, string>> {
  return z.record(z.string(), z.string());
}

function isService(binding: Service | string | undefined): binding is Service {
  return binding instanceof Object && "fetch" in binding;
}

function refusal(name: string | null, targets: Record<string, string>): Response {
  const asked = name === null ? `no ${WORKER_HEADER} header` : `${WORKER_HEADER}: ${name} is not in the stack`;

  return new Response(`${asked}; its Workers: ${Object.keys(targets).join(", ")}\n`, { status: NOT_FOUND });
}

/**
 * The local stack's primary Worker: one port in front of every Worker in the shared `wrangler dev`. It hands each
 * request to the Worker the edge names in `x-loc-worker`, over an in-process service binding.
 */
function fetchTarget(request: Request, env: DispatcherEnv): Promise<Response> | Response {
  const targets = targetsSchema().parse(JSON.parse(env.TARGETS));
  const name = request.headers.get(WORKER_HEADER);
  const binding = name === null ? undefined : env[targets[name] ?? ""];

  return isService(binding) ? binding.fetch(request) : refusal(name, targets);
}

/** A Worker module: its fetch handler. */
type Dispatcher = { fetch: (request: Request, env: DispatcherEnv) => Promise<Response> | Response };

const dispatcher: Dispatcher = { fetch: fetchTarget };

// A Worker module's handler is its default export: workerd serves no other.
export default dispatcher;
