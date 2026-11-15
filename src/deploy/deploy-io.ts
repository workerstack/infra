import type { ChildEnv } from "../child-env.ts";
import type { Product } from "../products.ts";
import type { Log } from "../shared/log.ts";
import type { DeployScope } from "../workers/deploy-scope.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import type { ChildOptions } from "./child-options.ts";
import type { DeployTool } from "./deploy-tool.ts";

/** The edges a deploy runs through, swapped by a test: programs, the filesystem, the Cloudflare API and output. */
export type DeployIo = {
  /** The product's child env; fails with the fix line for a missing credential. */
  env: (product: Product) => ChildEnv;
  /** Where a failure line goes. */
  error: Log;
  /** Makes the dev server `cf` looks for findable from the package dir. */
  linkDevServer: (packageDir: string) => void;
  /** The package's `package.json` scripts. */
  packageScripts: (packageDir: string) => Record<string, string>;
  print: Log;
  /** A program whose stdout is read; stdin is closed, so wrangler takes its defaults. */
  run: (tool: DeployTool, args: string[], child: ChildOptions) => Promise<{ code: number; stdout: string }>;
  /** The values of the secrets the Worker's config declares in `scope`. */
  secrets: (target: WorkerTarget, scope: DeployScope) => Promise<Record<string, string>>;
  /** Writes the product's zone redirect rules and answers their descriptions. */
  setRedirects: (product: Product) => Promise<string[]>;
  /** A program that talks to the terminal; resolves to its exit code. */
  spawn: (tool: DeployTool, args: string[], child: ChildOptions) => Promise<number>;
};
