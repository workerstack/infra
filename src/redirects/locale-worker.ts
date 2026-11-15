import type { LocaleWorkerRoute } from "./locale-worker-route.ts";

/** One Worker as the rules read it: its dir, the name it deploys as, and its prod routes. */
export type LocaleWorker = { dir: string; name: string; routes: readonly LocaleWorkerRoute[] };
