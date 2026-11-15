import type { Child, ChildExit } from "./child.ts";

/** How a child ended, with its last lines. */
export function crashReport(child: Child, exit: ChildExit): string {
  const how = exit.signal === null ? `with code ${String(exit.code)}` : `on ${exit.signal}`;
  const lines = child.lastLines();

  return `${child.name} exited ${how}${lines.length > 0 ? `; its last lines:\n  ${lines.join("\n  ")}` : ""}`;
}
