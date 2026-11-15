import type { CfFetch } from "../../api/cf-fetch.ts";
import { okBody } from "../../api/__fixtures__/fake-fetch.ts";
import type { Product } from "../../products.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";
import type { Json } from "../../shared/json.ts";
import type { WorkerTarget } from "../../workers/worker-target.ts";
import type { ObservabilityHost } from "../observability-host.ts";

export type Seen = { body: string | undefined; headers: unknown; method: string | undefined; url: string };

export type SyncRun = { err: string[]; host: ObservabilityHost; out: string[]; seen: Seen[] };

const GLOBAL = {
  CLOUDFLARE_ACCOUNT_EMAIL: "ops@example.com",
  CLOUDFLARE_ACCOUNT_ID: "acc-from-env",
  CLOUDFLARE_API_KEY: "key",
  CLOUDFLARE_API_TOKEN: "tok",
};

/** A target for `script` whose product env holds the account credentials in `global`. */
export function target(script: string, observability?: Json, global: Record<string, string> = GLOBAL): WorkerTarget {
  const product: Product = {
    config: { env: fakeInfraEnv({ global }) },
    configFile: "/repo/infra.config.ts",
    name: "web",
    root: "/repo",
  };

  const scope = { scriptName: script, ...(observability !== undefined && { observability }) };

  return {
    ...scope,
    worker: { baseName: "web-api", dir: "api", packageDir: "/repo/api", product, scopes: { prod: scope } },
  };
}

/** A host over `targets` whose fetch answers each request with the next of `settings` as the live observability. */
export function syncRun(targets: WorkerTarget[], settings: Json[]): SyncRun {
  const seen: Seen[] = [];
  const queue = [...settings];

  const fetcher: CfFetch = (url, init) => {
    seen.push({ body: typeof init.body === "string" ? init.body : undefined, headers: init.headers, method: init.method, url });

    return Promise.resolve(new Response(JSON.stringify(okBody({ observability: queue.shift() ?? null }))));
  };

  const err: string[] = [];
  const out: string[] = [];

  const host: ObservabilityHost = {
    cwd: "/repo",
    fetcher,
    guard: () => undefined,
    load: () => Promise.resolve({ root: "/repo", workers: targets.map((entry) => entry.worker) }),
    root: () => "/repo",
    stderr: (line) => err.push(line),
    stdout: (line) => out.push(line),
  };

  return { err, host, out, seen };
}
