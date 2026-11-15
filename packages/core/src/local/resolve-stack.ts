import type { StackCandidate, StackChoice, StackMember } from "./stack-candidate.ts";

function checkWith(candidates: readonly StackCandidate[], choice: StackChoice): void {
  const optIn = candidates.filter((candidate) => candidate.kind === "container").map((candidate) => candidate.dir);
  const unknown = choice.with?.find((dir) => !optIn.includes(dir));

  if (unknown === undefined) return;

  const listed = optIn.length === 0 ? "none" : optIn.join(", ");

  throw new Error(`--with ${unknown}: not an opt-in Worker (opt-in: ${listed})`);
}

function memberOf(candidate: StackCandidate, choice: StackChoice): StackMember[] {
  const { kind } = candidate;

  if (kind === "app" || kind === "worker") return [{ ...candidate, kind }];

  if (kind === "container" && choice.with?.includes(candidate.dir) === true)
    return [{ ...candidate, container: true, kind: "worker" }];

  return [];
}

function checkServedOnce(members: readonly StackMember[]): void {
  const served = new Map<string, string>();

  for (const member of members) {
    const other = served.get(member.name);

    if (other !== undefined)
      throw new Error(`${other} and ${member.dir} both serve ${member.name}; the stack runs one`);

    served.set(member.name, member.dir);
  }
}

/**
 * The stack's members, in candidate order: every Worker and app, plus each `--with` container Worker, narrowed to
 * `--only`. A name that matches nothing fails listing what would.
 */
export function resolveStack(candidates: readonly StackCandidate[], choice: StackChoice): StackMember[] {
  checkWith(candidates, choice);

  const members = candidates.flatMap((candidate) => memberOf(candidate, choice));

  checkServedOnce(members);

  const { only } = choice;

  if (only === undefined) return members;

  const dirs = members.map((member) => member.dir);
  const unknown = only.find((dir) => !dirs.includes(dir));

  if (unknown !== undefined) throw new Error(`--only ${unknown}: not in the stack (in it: ${dirs.join(", ")})`);

  return members.filter((member) => only.includes(member.dir));
}
