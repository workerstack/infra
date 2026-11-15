import type { GraphBody } from "./graph-body.ts";

/** One Graph request: its method, path and optional JSON body. */
export type GraphCall = { body?: GraphBody; method: string; path: string };
