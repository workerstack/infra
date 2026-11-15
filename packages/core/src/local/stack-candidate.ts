import type { LocalRoute } from "./local-route.ts";
import type { Outside } from "./outside.ts";

/**
 * What a Worker package is to the local stack: a Worker run in the shared `wrangler dev`, an app in `local.apps` run
 * in its own Vite, a container Worker that joins only with `--with`, or a Vite package not in `local.apps`, which the
 * stack leaves out.
 */
export type CandidateKind = "app" | "container" | "vite" | "worker";

/** One Worker package of the product, as the stack sees it. */
export type StackCandidate = {
  /** Its `.cloudflare/wrangler.local.json`, absolute. */
  config: string;
  /** The package dir under the product root (`api`), how `--only`, `--with` and `local.apps` name it. */
  dir: string;
  kind: CandidateKind;
  /** The Worker's name in `local` (`web-api-local`). */
  name: string;
  packageDir: string;
  /** Its prod routes, on the product's local host. */
  routes: LocalRoute[];
  /** The Worker's name without its scope suffix (`web-api`), what its routes name and several dirs can share. */
  worker: string;
};

/** A package the stack runs; `container` marks a Worker that joined with `--with`, which needs Docker. */
export type StackMember = Omit<StackCandidate, "kind"> & { container?: true; kind: "app" | "worker" };

/** `--only` narrows the stack to the named dirs; `--with` adds opt-in container Workers. */
export type StackChoice = { only?: readonly string[] | undefined; with?: readonly string[] | undefined };

/** The stack's members, the routes the edge matches and, by Worker name, each routed Worker no member serves. */
export type ProductStack = { members: StackMember[]; outside: Map<string, Outside>; routes: LocalRoute[] };

/** Where a request lands: the member that serves its route, the Worker the stack leaves out, or nowhere. */
export type Landing = { kind: "member"; member: StackMember } | ({ kind: "outside" } & Outside);
