---
description: Worker configs from one env
order: 60
---

# Worker configs from one env

A product writes one `*.cf-kit.ts` that builds a kit from its infra config. Each Worker's `cloudflare.config.ts` asks the kit for bindings, vars and secrets per scope (`local`, `dev` and `prod`), so every Worker reads the same env.

```ts
// apps/web/web.cf-kit.ts
import { join } from "node:path";

import { createCfKit, defineInfraConfig } from "@workerstack/infra";

const config = defineInfraConfig({
  env: { dev: {}, global: {}, local: {}, prod: {}, sealedKeys: () => new Set(["API_KEY"]) },
});

export const kit = createCfKit({ config, ratelimitIds: join(import.meta.dirname, "ratelimit-ids.json") });
```

In a product the config is `infra.config.ts`'s default export, imported by the kit file. A Worker's `cloudflare.config.ts` then asks the kit:

```text
// apps/web/api/cloudflare.config.ts
export default defineConfig(({ mode }) => {
  const env = kit.env(mode);

  return {
    worker: {
      env: { ...kit.d1(env, "DB"), ...kit.secrets("API_KEY"), ...kit.vars(env, "GREETING") },
      entrypoint: "./src/index.ts",
      name: kit.name("api", env),
    },
  };
});
```

`createCfKit` also takes `migrations`, `localRemote` and `defaults`. Binding names type-check against the config's bindings.

## The kit file

- A product has exactly one `*.cf-kit.ts` under its root, and it exports the kit (`isCfKit` tells). `infra gen` finds it there.
- A Worker package is a directory with a `cloudflare.config.ts`. node_modules, .git and .worktrees are skipped.

## Sealed and plain

- `kit.vars(env, ...keys)` takes plain values. A sealed key never lands in a var.
- `kit.secrets(...keys)` takes sealed values. A key must be sealed in `local`, `dev` and `prod`, because a secret goes up with a deploy and runs locally from `.dev.vars.local`.
- A secret with no value in a scope fails naming the key and scope.

The two errors, each printed as `infra gen: <product>: <message>`:

```console
infra gen: apps/web: API_KEY is sealed in local; ask kit.secrets for it, not kit.vars
infra gen: apps/web: GREETING is not sealed in prod; a secret must be sealed: bun repo env set GREETING --scope prod
```

A product with two kit files stops too:

```console
infra gen: apps/web: 2 kits (a.cf-kit.ts, b.cf-kit.ts); a product has one
```

## Generating

```console
$ infra gen
wrote apps/web/api/.cloudflare/wrangler.local.json
wrote apps/web/api/.dev.vars.local
$ infra gen --check
infra gen: apps/web: apps/web/api/.cloudflare/wrangler.dev.json is out of date; run infra gen
```

`infra gen [name|--all] [--check]` writes `.cloudflare/wrangler.<scope>.json` and `.dev.vars.<scope>` for every Worker package, then types each with `cf workers types`. `--check` writes nothing and exits 1 naming each file that is out of date.
