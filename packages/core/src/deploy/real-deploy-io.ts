import { appendArgs } from "../append-args.ts";
import { linkDevServer } from "../cf-config/link-dev-server.ts";
import { realHost } from "../command/real-host.ts";
import type { PeerProgram } from "../peer-program.ts";
import { peerProgram } from "../peer-program.ts";
import { wranglerEnv } from "../wrangler-env.ts";
import type { DeployIo } from "./deploy-io.ts";
import type { DeployTool } from "./deploy-tool.ts";
import { packageScripts } from "./package-scripts.ts";
import { productSecrets } from "./product-secrets.ts";
import { runChild } from "./run-child.ts";
import { setProductRedirects } from "./set-product-redirects.ts";

// `bun` from the path; `cf` and `wrangler` as the peer packages installed for `root`.
function deployProgram(root: string, tool: DeployTool, args: string[]): PeerProgram {
  return tool === "bun" ? { args, file: "bun" } : appendArgs(peerProgram(root, tool, tool), args);
}

/** The `DeployIo` of a real deploy: programs from `root`'s peer packages, the product's env and the real streams. */
export function realDeployIo(root: string): DeployIo {
  const host = realHost();

  return {
    env: (product) => wranglerEnv(product.config.env),
    error: host.stderr,
    linkDevServer: (packageDir) => {
      linkDevServer(packageDir);
    },
    packageScripts,
    print: host.stdout,
    run: (tool, args, child) => runChild(deployProgram(root, tool, args), child, { capture: true }),
    secrets: productSecrets,
    setRedirects: setProductRedirects,
    spawn: async (tool, args, child) => {
      const ran = await runChild(deployProgram(root, tool, args), child, { capture: false });

      return ran.code;
    },
  };
}
