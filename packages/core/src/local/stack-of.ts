import type { LocalRoute } from "./local-route.ts";
import type { Outside, OutsideWhy } from "./outside.ts";
import { resolveStack } from "./resolve-stack.ts";
import type { CandidateKind, ProductStack, StackCandidate, StackChoice } from "./stack-candidate.ts";

// The reason a person can act on wins: a dir `--only` left out, then one `--with` would add.
const ACTIONABLE: readonly OutsideWhy[] = ["vite", "opt-in", "not-chosen"];

function whyOutside(kind: CandidateKind): OutsideWhy {
  if (kind === "vite") return "vite";

  return kind === "container" ? "opt-in" : "not-chosen";
}

function moreActionable(a: OutsideWhy, b: OutsideWhy): OutsideWhy {
  return ACTIONABLE.indexOf(a) >= ACTIONABLE.indexOf(b) ? a : b;
}

// Each routed Worker's routes, once per Worker name, in candidate order.
function routesOf(candidates: readonly StackCandidate[]): LocalRoute[] {
  const first = candidates.filter(
    (candidate, at) => candidates.findIndex((other) => other.worker === candidate.worker) === at,
  );

  return first.flatMap((candidate) => candidate.routes);
}

/** The members and the route table of a stack from its candidates. */
export function stackOf(candidates: readonly StackCandidate[], choice: StackChoice): ProductStack {
  const members = resolveStack(candidates, choice);
  const served = new Set(members.map((member) => member.worker));
  const routed = candidates.filter((candidate) => candidate.routes.length > 0);
  const outside = new Map<string, Outside>();

  for (const candidate of routed.filter((each) => !served.has(each.worker))) {
    const entry = outside.get(candidate.worker);
    const why = whyOutside(candidate.kind);

    outside.set(candidate.worker, {
      dirs: [...(entry?.dirs ?? []), candidate.dir],
      why: entry === undefined ? why : moreActionable(entry.why, why),
    });
  }

  return { members, outside, routes: routesOf(routed) };
}
