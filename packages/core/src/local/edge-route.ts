import * as z from "zod";

/** A route as a Wrangler config states it: a bare pattern, or a pattern with its zone and custom-domain flag. */
export type EdgeRoute = string | { custom_domain?: boolean | undefined; pattern: string };

/** A Wrangler config's `routes`. */
export function edgeRoutesSchema(): z.ZodType<EdgeRoute[]> {
  return z.array(z.union([z.string(), z.object({ custom_domain: z.boolean().optional(), pattern: z.string() })]));
}
