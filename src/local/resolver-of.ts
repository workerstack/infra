import type { EdgeTarget, Routing } from "./edge-target.ts";
import { landing } from "./landing.ts";
import type { ProductStack } from "./stack-candidate.ts";
import type { StackProcess } from "./stack-options.ts";

/** The edge's resolver: the route Cloudflare would pick, sent to the process that serves it. */
export function resolverOf(stack: ProductStack, processes: readonly StackProcess[]): Routing["resolve"] {
  function urlOf(dir: string): string {
    const url = processes.find((each) => each.serves.includes(dir))?.url;

    if (url === undefined) throw new Error(`no process serves ${dir}`);

    return url;
  }

  const entry = processes.find((each) => each.entry === true)?.url;

  return (host, path): EdgeTarget | undefined => {
    const target = landing(stack, host, path);

    if (target === undefined || target.kind === "outside") return target;

    const { member } = target;

    if (member.kind === "app") return { kind: "app", url: urlOf(member.dir) };

    if (entry === undefined) throw new Error(`no process runs the dispatcher for ${member.dir}`);

    return { kind: "worker", name: member.name, url: entry };
  };
}
