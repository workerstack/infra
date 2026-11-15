import type { Child, LineSink } from "./child.ts";
import type { ProductStack } from "./stack-candidate.ts";

/** Whether Docker answers, for a `--with` container Worker. */
export type DockerAnswer = { ok: true } | { ok: false; reason: string };

/** What `startStack` starts: the stack `productStack` read, and where and how to run it. */
export type StackOptions = ProductStack & {
  /** `docker info` by default. */
  docker?: () => DockerAnswer;
  /** The product's local host (`example.localhost`). */
  host: string;
  onLine?: LineSink;
  /** The port the origin tries first; 80, so the origin has no port. */
  originCandidate?: number;
  /**
   * Runs once the state file names the origin and before any child starts: `infra gen`, which writes that origin's
   * URL vars into each Worker's `.dev.vars.local`.
   */
  prepare?: () => Promise<void>;
  /** The product's name, as refusals show it. */
  product: string;
  productRoot: string;
};

/** One process of the stack: the shared `wrangler dev` (every Worker behind the dispatcher) or one app's Vite. */
export type StackProcess = {
  child: Child;
  /** The process the edge sends every Worker's request to: the one running the dispatcher. */
  entry?: true;
  inspector: number;
  /** What it serves: the Workers' dirs, or the app's. */
  serves: string[];
  url: string;
};

/** A started stack. */
export type RunningStack = {
  /** Resolves with the child that exited, after the rest are stopped; never after `stop`. */
  failed: Promise<Child>;
  origin: string;
  processes: StackProcess[];
  stop: () => Promise<void>;
  table: string;
};
