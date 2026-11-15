import type { DeployScope } from "../workers/deploy-scope.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import { assertExit } from "./assert-exit.ts";
import { buildScriptOf } from "./build-script-of.ts";
import type { DeployIo } from "./deploy-io.ts";
import type { DeployRequest } from "./deploy-request.ts";
import type { DeployRun } from "./deploy-run.ts";
import { pruneSecrets } from "./prune-secrets.ts";
import { setLocaleRedirects } from "./set-locale-redirects.ts";
import { withSecretsFile } from "./with-secrets-file.ts";

// `cf deploy --mode <scope>` reads the package's `cloudflare.config.ts` itself; `--prebuilt` deploys the build
// `build:<scope>` just made, which `cf` checks was built in the deploy's mode.
function deployArgs(scope: DeployScope, extra: { file?: string; prebuilt: boolean }): string[] {
  return [
    "deploy",
    "--mode",
    scope,
    ...(extra.prebuilt ? ["--prebuilt"] : []),
    ...(extra.file === undefined ? [] : ["--secrets-file", extra.file]),
  ];
}

/**
 * Deploys one Worker. The product's credentials are read first, so a missing one fails before any program runs. A
 * Vite-built Worker runs its `build:<scope>` first, and a failed build stops the deploy before any secret is read.
 * The scope's secret values go up from a 0600 file that is gone when `cf deploy` ends. Then the Worker's undeclared
 * secrets are named, and deleted under `--prune`. A failure throws its message.
 */
export async function deployWorker(target: WorkerTarget, request: DeployRequest, io: DeployIo): Promise<void> {
  const { packageDir, product } = target.worker;

  const run: DeployRun = {
    child: { cwd: packageDir, env: io.env(product) },
    io,
    prune: request.prune,
    scope: request.scope,
  };

  io.linkDevServer(packageDir);

  const build = buildScriptOf(io.packageScripts(packageDir), run.scope);

  if (build !== undefined) assertExit(`bun run ${build}`, await io.spawn("bun", ["run", build], run.child));

  await setLocaleRedirects(target, run);

  const secrets = await io.secrets(target, run.scope);

  const code = await withSecretsFile(secrets, (file) =>
    io.spawn(
      "cf",
      deployArgs(run.scope, { prebuilt: build !== undefined, ...(file !== undefined && { file }) }),
      run.child,
    ),
  );

  assertExit("cf deploy", code);
  await pruneSecrets(target, Object.keys(secrets), run);
}
