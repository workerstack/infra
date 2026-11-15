import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GENERATED_DIR } from "../../cf-config/cf-config.constants.ts";
import { localRoutes } from "../local-routes.ts";
import type { ProductStack, StackCandidate } from "../stack-candidate.ts";
import { stackOf } from "../stack-of.ts";
import type { StackOptions } from "../stack-options.ts";

export const FIXTURE_HOST = "fx.localhost";

const ZONE = "fx.example";
const COMPATIBILITY_DATE = "2026-01-20";
// Under the package, so wrangler and zod resolve from the product root.
const WORK = join(import.meta.dirname, "../../../.tmp");
const DIRS = ["a", "b", "c", "d", "e"] as const;

/** Each package's prod routes: `c` a Vite package the stack leaves out, `e` an app. */
const ROUTES: Record<(typeof DIRS)[number], string[]> = {
  a: ["fx.example/a*"],
  b: ["b.fx.example/*"],
  c: ["fx.example/c*"],
  d: ["fx.example/d*"],
  e: ["fx.example/e*"],
};

const KINDS = { a: "worker", b: "worker", c: "vite", d: "worker", e: "app" } as const;

/** A temp product root under the package's `.tmp/`. */
export function tempRoot(): string {
  mkdirSync(WORK, { recursive: true });

  return mkdtempSync(join(WORK, "loc-launch-"));
}

/** Removes the temp root, and the `update-check` cache wrangler leaves in the temp dir. */
export function removeRoot(root: string): void {
  rmSync(root, { force: true, recursive: true });
  rmSync(join(tmpdir(), "update-check"), { force: true, recursive: true });
}

/** The fixture's stack under `productRoot`, as `productStack` would read it, without touching its files. */
export function fixtureStack(productRoot: string): ProductStack {
  const candidates = DIRS.map((dir): StackCandidate => {
    const packageDir = join(productRoot, dir);
    const worker = `fx-${dir}`;
    const routes = ROUTES[dir].map((pattern) => ({ pattern, zone_name: ZONE }));

    return {
      config: join(packageDir, GENERATED_DIR, "wrangler.local.json"),
      dir,
      kind: KINDS[dir],
      name: `${worker}-local`,
      packageDir,
      routes: localRoutes(routes, FIXTURE_HOST, worker),
      worker,
    };
  });

  return stackOf(candidates, {});
}

const WORKERS = {
  // `a` puts a message on a queue; `b` keeps the last in KV and answers `<mark> <last>`, or its URL's host on /host.
  a: {
    code: `export default { async fetch(request, env) { await env.Q.send(new URL(request.url).searchParams.get("m") ?? "hi"); return new Response("sent") } }`,
    config: { queues: { producers: [{ binding: "Q", queue: "fx-q" }] } },
  },
  b: {
    code: `export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === "/host") return new Response(url.host)
    return new Response(env.MARK + " " + ((await env.KV.get("seen")) ?? ""))
  },
  async queue(batch, env) { for (const m of batch.messages) await env.KV.put("seen", String(m.body)) },
}`,
    config: { kv_namespaces: [{ binding: "KV", id: "fx-kv" }], queues: { consumers: [{ max_batch_timeout: 0, queue: "fx-q" }] } },
  },
  d: {
    code: `export default { async fetch(request, env) { return new Response("generated " + env.MARK + " " + env.SECRET) } }`,
    config: {},
  },
};

// A `vite` that answers `app <mark> <path>` on the port it is given, as the app's `bun x vite dev` would serve.
const FAKE_VITE = `#!/usr/bin/env node
const http = require("node:http")
const port = Number(process.argv[process.argv.indexOf("--port") + 1])
http.createServer((request, response) => response.end("app " + process.env.FX_MARK + " " + request.url)).listen(port, "127.0.0.1")
`;

function writeApp(productRoot: string, mark: string): void {
  const bin = join(productRoot, "e/node_modules/.bin");

  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, "vite"), FAKE_VITE.replace("process.env.FX_MARK", JSON.stringify(mark)));
  chmodSync(join(bin, "vite"), 0o755);
}

/**
 * The fixture product under `productRoot`, each Worker with the generated local config `infra gen` writes (the
 * local env alone, named in full, a secret in the `.dev.vars` beside it), and `e` an app with a fake `vite`.
 */
export function fixtureProduct(productRoot: string, mark: string): ProductStack {
  for (const [dir, worker] of Object.entries(WORKERS)) {
    const packageDir = join(productRoot, dir);
    const generated = join(packageDir, GENERATED_DIR);
    const main = join(packageDir, "index.js");
    const config = { compatibility_date: COMPATIBILITY_DATE, main, name: `fx-${dir}-local`, vars: { MARK: mark }, ...worker.config };

    mkdirSync(generated, { recursive: true });
    writeFileSync(main, worker.code);
    writeFileSync(join(generated, "wrangler.local.json"), JSON.stringify(config));
    writeFileSync(join(generated, ".dev.vars"), `SECRET="${mark}-secret"\n`);
  }

  writeApp(productRoot, mark);

  return fixtureStack(productRoot);
}

/** The options `startStack` takes for the fixture under `productRoot`. */
export function fixtureOptions(productRoot: string, stack: ProductStack): StackOptions {
  return { ...stack, host: FIXTURE_HOST, onLine: () => {}, product: "fx", productRoot };
}
