import { VITE_DEV_MODE } from "../cf-kit/cf-kit.constants.ts";
import { freePort } from "./free-port.ts";
import { LOOPBACK } from "./local.constants.ts";
import type { SpawnContext } from "./spawn-context.ts";
import { spawnGroup } from "./spawn-group.ts";
import type { StackMember } from "./stack-candidate.ts";
import type { StackProcess } from "./stack-options.ts";

/** One app in its own `vite dev` in its package dir, on a free port, its Worker's inspector on another. */
export async function spawnApp(app: StackMember, context: SpawnContext): Promise<StackProcess> {
  const port = await freePort();
  const inspector = await freePort();
  const flags = ["--mode", VITE_DEV_MODE, "--host", LOOPBACK, "--port", String(port), "--strictPort"];

  const child = await spawnGroup({
    cmd: ["bun", "x", "vite", "dev", ...flags],
    cwd: app.packageDir,
    env: { ...context.env, CLOUDFLARE_INSPECTOR_PORT: String(inspector) },
    name: app.dir,
    onLine: context.onLine,
  });

  context.track(child);

  return { child, inspector, serves: [app.dir], url: `http://${LOOPBACK}:${port}` };
}
