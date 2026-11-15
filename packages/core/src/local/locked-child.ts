import * as z from "zod";

/** What the lock records of each child: enough to tell it from a stranger that reused its pid. */
export type LockedChild = { cmdline: string; pgid: number; pid: number; start: number };

/** The lock file's shape: the children one stack started. */
export function lockSchema(): z.ZodType<{ children: LockedChild[] }> {
  return z.object({
    children: z.array(z.object({ cmdline: z.string(), pgid: z.int(), pid: z.int(), start: z.number() })),
  });
}
