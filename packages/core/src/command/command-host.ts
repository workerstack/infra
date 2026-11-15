import type { Product } from "../products.ts";
import type { Log } from "../shared/log.ts";

/** The edges a command runs through: the current dir, the repo scan, the test-runner guard and both output streams. */
export type CommandHost = {
  cwd: string;
  discover: (root: string) => Promise<Product[]>;
  guard: () => void;
  root: (cwd: string) => string;
  stderr: Log;
  stdout: Log;
};
