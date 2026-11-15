import type { IncomingMessage } from "node:http";

import type { ProxyTarget, Routing } from "./edge-target.ts";
import { NOT_FOUND, SERVICE_UNAVAILABLE } from "./local.constants.ts";
import type { Outside, OutsideWhy } from "./outside.ts";

/** What the edge does with a request: answer it itself, or proxy it. */
type Decision = { kind: "answer"; status: number; text: string } | { kind: "proxy"; target: ProxyTarget };

const OUTSIDE_PAGES: Record<OutsideWhy, (at: string, dirs: string) => string> = {
  "not-chosen": (at, dirs) =>
    `${at} is served by ${dirs}, which this stack's --only left out: start it without --only, or name one of them`,
  "opt-in": (at, dirs) => `${at} is served by ${dirs}, an opt-in Worker: start the stack with --with ${dirs}`,
  vite: (at, dirs) =>
    `${at} is served by ${dirs}: ${dirs} runs under Vite and is not in local.apps, so the stack leaves it out; ` +
    "add it to local.apps to run it",
};

function answer(status: number, text: string): Decision {
  return { kind: "answer", status, text: `${text}.\n` };
}

function outsidePage(at: string, outside: Outside): Decision {
  return answer(SERVICE_UNAVAILABLE, OUTSIDE_PAGES[outside.why](at, outside.dirs.join(", ")));
}

/** The edge's answer to a request: 503 while starting, 404 off every route, the left-out page, else a proxy. */
export function edgeDecision(routing: Routing | undefined, request: IncomingMessage): Decision {
  if (routing === undefined) return answer(SERVICE_UNAVAILABLE, "The local stack is starting; reload in a moment");

  const host = request.headers.host ?? "";
  const path = new URL(request.url ?? "/", "http://edge").pathname;
  const target = routing.resolve(host, path);

  if (target === undefined)
    return answer(NOT_FOUND, `No route matches ${host}${path}; this stack serves ${routing.hosts.join(", ")}`);

  if (target.kind === "outside") return outsidePage(`${host}${path}`, target);

  return { kind: "proxy", target };
}
