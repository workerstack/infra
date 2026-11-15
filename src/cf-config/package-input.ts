import type { CfKit } from "../cf-kit/cf-kit.ts";

/**
 * One Worker package to generate: its dir, the product's kit, the running local stack's origin (the URL vars in
 * `.dev.vars.local` follow it) and the config's path as the header names it.
 */
export type PackageInput = { dir: string; kit: CfKit; origin: string | undefined; shown: string };
