---
description: Worker configs from one env
order: 60
---

# Worker configs from one env

A product writes one `infra.config.ts`. The value `defineInfraConfig` returns is the config and the kit at once. Each Worker's `cloudflare.config.ts` imports it and asks it for bindings, vars and secrets per scope (`local`, `dev` and `prod`), so every Worker reads the same env.

```ts
// apps/web/infra.config.ts
import { defineInfraConfig } from "@workerstack/infra";

export default defineInfraConfig({
  cloudflare: {
    bindings: { local: { d1_databases: { DB: { database_id: "db-local-id", database_name: "db-local" } } } },
    zone: { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" },
  },
  env: { dev: {}, global: {}, local: { GREETING: "hi" }, prod: {}, sealedKeys: () => new Set(["API_KEY"]) },
});
```

A Worker's `cloudflare.config.ts` then asks it:

```text
// apps/web/api/cloudflare.config.ts
import infra from "../infra.config.ts";

export default defineConfig(({ mode }) => {
  const scope = infra.scope(mode);

  return {
    worker: {
      ...infra.defaults,
      env: { ...infra.d1(scope, "DB"), ...infra.secrets("API_KEY"), ...infra.vars(scope, "GREETING") },
      entrypoint: "./src/index.ts",
      name: infra.name("api", scope),
    },
  };
});
```

`infra.scope(mode)` is the scope of a `--mode` (Vite's `development` is `local`); `infra.env.local` and the other views still read the env. Binding names type-check against the config's bindings, and var and secret names against the env's keys: `infra.d1(scope, "NOPE")` is a type error. The kit's options live in `cloudflare.workers` (see Config): `defaults`, `migrations`, `localRemote` and `ratelimitIds`.

## Migrations

`migrations` names, per D1 binding, the directory of its migrations, the Worker that owns them and, optionally, the database its `database.migrate.config.ts` calls it:

```text
// infra.config.ts, in cloudflare.workers
migrations: { DB: { database: "main", dir: join(import.meta.dirname, "db/migrations"), owner: "web-api" } },
```

- `dir` and `owner`: `infra gen` writes `migrations_dir` into the owner Worker's config. Nothing else of `migrations` lands in the generated files.
- `database`: `infra db-migrate` runs `database migrate apply main -e <scope> --yes --json` for the binding, in the nearest directory from `dir` up to the product root that holds `database.migrate.config.ts`. A binding with no `database` is skipped.
- `infra db-wipe` reads the tables the `.sql` files in `dir` create, so it empties those and drops the rest.

## Rate limits

`infra.ratelimits(worker, scope, ...limits)` gives each limiter its namespace id from the registry. `infra gen` gives a new limiter the next free id and writes it there. The registry is `cloudflare.workers.ratelimitIds` when set, else `ratelimit-ids.json` at the product root: the root `infra` loaded the config from, or, in a process `infra` did not start (`cf workers types`, `vite dev`), the nearest directory above the working directory that holds an `infra.config.ts`. Commit the file, so an id never changes.

## The product

- The kit is `infra.config.ts`'s default export (`isCfKit` tells). A default export that is not `defineInfraConfig`'s value fails the command.
- A Worker package is a directory with a `cloudflare.config.ts`. node_modules, .git and .worktrees are skipped.
- A kit file left from before fails `infra gen`, naming its move:

```console
infra gen: apps/web: web.cf-kit.ts: the kit is built by defineInfraConfig now; move its options to cloudflare.workers in infra.config.ts and delete the file
```

## Sealed and plain

- `infra.vars(scope, ...keys)` takes plain values. A sealed key never lands in a var.
- `infra.secrets(...keys)` takes sealed values. A key must be sealed in `local`, `dev` and `prod`, because a secret goes up with a deploy and runs locally from `.dev.vars.local`. With no `sealedKeys` on the env, nothing is sealed, so a product with secrets gives it.
- A secret with no value in a scope fails naming the key and scope.

The two errors, each printed as `infra gen: <product>: <message>`:

```console
infra gen: apps/web: API_KEY is sealed in local; ask kit.secrets for it, not kit.vars
infra gen: apps/web: GREETING is not sealed in prod; a secret must be sealed: bun repo env set GREETING --scope prod
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
