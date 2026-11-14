import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { ChildEnv } from "../child-env.ts";
import { peerBin } from "../peer-bin.ts";
import type { AiSearchInstanceConfig } from "../schema/bindings.ts";
import { aiSearchCreateArgs } from "./ai-search-create-args.ts";
import { WRANGLER_LOGIN_MESSAGE } from "./wrangler-login-message.constants.ts";

/** How to run wrangler: the repo whose install holds it, and the env its child gets. */
export type WranglerTarget = { env: ChildEnv; root: string };

/**
 * Creates an AI Search instance through the wrangler peer's bin. It needs a wrangler login:
 * REST tokens cannot pass the domain ownership check of a web crawler.
 */
export async function createAiSearch(config: AiSearchInstanceConfig, target: WranglerTarget): Promise<void> {
  const bin = peerBin(target.root, "wrangler", "wrangler");
  const run = promisify(execFile);
  const options = { cwd: target.root, env: { ...target.env } };

  try {
    await run(process.execPath, [bin, "whoami"], options);
  } catch (cause) {
    throw new Error(WRANGLER_LOGIN_MESSAGE, { cause });
  }

  try {
    await run(process.execPath, [bin, ...aiSearchCreateArgs(config)], options);
  } catch (cause) {
    throw new Error(`wrangler ai-search create "${config.instanceName}" failed`, { cause });
  }
}
