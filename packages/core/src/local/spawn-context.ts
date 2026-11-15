import type { Child, LineSink } from "./child.ts";
import type { StackEnv } from "./stack-env.ts";

/** What spawning a stack process needs: the shared env, where lines go, and `track`, which records each child. */
export type SpawnContext = StackEnv & {
  onLine: LineSink | undefined;
  productRoot: string;
  track: (child: Child) => void;
};
