import type { Outside } from "./outside.ts";

/**
 * Where the edge sends a request: a Worker through the dispatcher, which reads its name from `x-loc-worker`; an
 * app's Vite; or a page naming the packages the stack leaves out.
 */
export type EdgeTarget =
  | { kind: "app"; url: string }
  | { kind: "worker"; name: string; url: string }
  | ({ kind: "outside" } & Outside);

/** A target the edge proxies to. */
export type ProxyTarget = Exclude<EdgeTarget, { kind: "outside" }>;

/** The edge's routing once the stack is up: the origins a 404 lists, and where each request goes. */
export type Routing = { hosts: readonly string[]; resolve: (host: string, path: string) => EdgeTarget | undefined };

/** The bound edge. Until `serve`, every request answers 503 starting. */
export type Edge = {
  close: () => Promise<void>;
  port: number;
  serve: (routing: Routing) => void;
  /** Why the candidate port was skipped, for the line the table prints. */
  skipped: string | undefined;
};
