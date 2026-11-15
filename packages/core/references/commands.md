---
description: Product and Worker commands
order: 50
---

# Commands

Five commands check, change and generate what a product's config describes, two migrate and wipe its D1 databases, and five more act on Workers, below. Each takes `[name|--all]`.

```console
$ infra get              # the product holding the current dir, else the only product
$ infra get web          # by product name (its dir)
$ infra get --all
$ infra set web
$ infra zone-get web
$ infra zone-set web
$ infra gen web --check
```

| Command         | What it does                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `infra get`     | Reports the live Cloudflare account and zone, then Google, Apple, Microsoft, GitHub, IndexNow and Yandex, against the config. Changes nothing. |
| `infra set`     | Provisions bindings, Access and AI Search, applies the zone and its redirects, then applies Google, Apple, Microsoft, GitHub, IndexNow and Yandex. A GitHub scope whose `clientId` is `STUB` opens a browser step. |
| `infra zone-get`| Reports the zone: rules, drift, declared bindings, R2, AI Search and Turnstile.                                   |
| `infra zone-set`| Applies the zone settings and the generated zone and locale redirects only.                                      |
| `infra gen`     | Writes each Worker package's `.cloudflare/wrangler.<scope>.json` and `.dev.vars.<scope>`, and the `database.migrate.config.ts` beside each D1 migrations dir whose `migrations` names a `database`. `--check` writes nothing and fails on drift. |
| `infra db-migrate` | Applies each D1 binding's migrations with `database migrate apply`. `--scope dev\|prod`, `prod` by default. |
| `infra db-wipe` | Empties each D1 binding's tables in a scope. `--scope dev\|prod` is required. |

## Target

- A name picks the product whose directory has that name, as `infra.config.ts` discovery names it.
- `--all` runs every product.
- With no name, the product holding the current directory runs. Outside every product the only product runs; with two or more, the command stops:

```console
infra get: 2 products; name one or pass --all: apps/admin, apps/web
```

An extra argument or an unknown flag prints `usage: infra get [name|--all]` and exits 2; `infra gen` prints `usage: infra gen [name|--all] [--check]`.

A failing product prints `infra <command>: <product>: <message>`. The rest still run, and the exit code is 1.

```console
infra zone-get: apps/web: no cloudflare zone in the config
```

## Local stack

```console
$ infra loc [name] [--only dir,...] [--with dir,...]
local stack at http://example.localhost
  http://example.localhost
  workers  http://127.0.0.1:41000  127.0.0.1:41001  api
  web      http://127.0.0.1:41002  127.0.0.1:41003  web
  state .../apps/web/.wrangler/state
  registry .../apps/web/.wrangler/loc/registry
```

`infra loc` runs one product until Ctrl-C or SIGTERM. With no name it runs the product holding the current dir. The product needs a `local` block.

- **Workers.** One `wrangler dev` under Node runs every Worker behind a dispatcher. Each Worker uses its generated `.cloudflare/wrangler.local.json`.
- **Apps.** Each dir in `local.apps` runs in its own `bun x vite dev`.
- **Containers.** A container Worker joins only with `--with` and needs Docker.
- **Vite packages not in `local.apps`.** They are left out.
- **`--only`.** Narrows the stack to the named dirs.
- **The edge.** It listens on the local host's port 80, or on a free port with the reason when 80 is taken. Each request goes to the Worker or app whose prod route Cloudflare would pick. A request on no route gets a 404 that lists the hosts. A request for a package left out gets a page naming it.
- **Before anything starts.** The command writes `.wrangler/loc/stack.json` with the origin, then runs `infra gen` for that origin.
- **Stopping.** A stop, or any child that exits, stops every process group. It removes the state and lock files. A child that exits prints its last lines and exits 1.
- **After a killed run.** The next start stops whatever the lock still names.

`--all`, a second name or an unknown flag prints `usage: infra loc [name] [--only dir,...] [--with dir,...]` and exits 2. A refusal exits 1:

```console
infra loc: apps/web: no local block in its infra config, so it has no local stack
infra loc: apps/web: --only nope: not in the stack (in it: api, web)
infra loc: apps/web: A local apps/web stack already runs from this checkout (pid 4242, http://example.localhost); stop it first
```

## Databases

```console
$ infra db-migrate [name|--all] [--scope dev|prod]
apps/web
  BINDING  DATABASE  STATUS   APPLIED  TIME
  DB       web-prod  applied  2        840ms
  CACHE    web-cache skipped  0        0ms
    ↳ no database in the kit's migrations
$ infra db-wipe [name|--all] --scope dev|prod [--binding NAME...] [--force] [--dry-run]
$ infra db-wipe web --scope dev --dry-run
apps/web
  BINDING  DATABASE  STATUS   DELETED  DROPPED  TIME
  DB       web-dev   dry-run  3        1        120ms
```

`db-migrate` runs `database migrate apply <database> -e <scope> --yes --json` for each D1 binding whose kit `migrations` name a `database` (see [cf-kit](cf-kit.md)), in the package that holds its `database.migrate.config.ts`. A binding with no `database` is `skipped`; one with no `database_name` in the scope fails. `--scope local` is a usage error: `usage: infra db-migrate [name|--all] [--scope dev|prod]`, exit 2.

`db-wipe` lists the live tables with `wrangler d1 execute --remote --json` through the generated `.cloudflare/wrangler.<scope>.json` that grants the binding its migrations. Tables the migrations create are emptied, the rest are dropped, and `d1_migrations`, `__drizzle_migrations`, `_cf_*` and SQLite internals keep their rows. The SQL goes through a temp file that is removed after. A rerun after a partial wipe plans only what is left. `--binding NAME` (repeatable) limits it; `--dry-run` only plans.

A prod wipe needs `--force`, and without it stops before any credential is read:

```console
infra db-wipe: apps/web: Refusing to wipe prod. Pass --force if you meant it.
```

Both read the product's credentials first, and need `@workerstack/database` and `wrangler` as peers. A failed binding prints its note under its row, then `infra <command>: <product>: N of M databases failed`, and the exit code is 1.

## Secret flow

`infra set` writes ids and secrets to different places.

- A new id (a D1 database, a KV namespace, a Microsoft or GitHub client id) is written into `infra.config.ts` by one file write.
- A new secret never touches the config. The Turnstile secret key, the Access service token secret and a new Microsoft or GitHub client secret go to `bun repo env set KEY --scope S --file F`, with the value on stdin. `F` is the env file under the product that calls `defineEnv(` and exports the config's `env`.

Each secret prints one line:

```console
wrote TURNSTILE_SECRET_KEY (prod) with bun repo env set
```

A product with no such env file stops with `no env file under apps/web exports the config's env; define it with defineEnv beside infra.config.ts`.

Microsoft adds a client secret only when the scope has no `MICROSOFT_CLIENT_SECRET`. A scope that has one gets none, so a rerun adds nothing.

Ids and secrets found before a step fails are still written.

### GitHub browser step

GitHub has no API that creates an OAuth app, so `infra set` creates a GitHub App, which also signs users in. For each `github.oauth` scope whose `clientId` is `STUB`, it serves a one-page form on `127.0.0.1` on a free port and opens it in the browser:

```console
    [prod] "Example App" ...
    → create the app in the browser: http://127.0.0.1:41234/
```

The page posts the app's manifest to GitHub, to the org's settings when `org` is set. Confirm the app there. GitHub sends the browser back to the local server, which checks the `state`, trades the code for the app's credentials and closes. The client id goes into `infra.config.ts` and the client secret to `GITHUB_CLIENT_SECRET` for that scope. The app's private key and webhook secret are not stored. The server gives up after 10 minutes.

A scope with a real client id and a `GITHUB_CLIENT_SECRET` does nothing. A real id with no secret prints how to add one. Under a test runner, or with no terminal, a `STUB` scope fails:

```console
infra set: apps/web: github.oauth.prod has clientId "STUB" and needs the browser; run infra set in a terminal
```

`infra get` looks each app up by its slug (the app name lowercased, with dashes) on the public GitHub API, with no token. It reports whether the app exists, whether its client id matches the config, and whether the env has `GITHUB_CLIENT_SECRET`.

### IndexNow and Yandex

`infra set` checks the IndexNow key file, then pushes every sitemap URL on the host to IndexNow, and adds each Yandex Webmaster sitemap the host is missing. `infra get` changes nothing: it reports whether the key file serves the key and how many URLs the sitemaps hold, then whether the Yandex host is verified and each sitemap added or missing:

```console
 IndexNow: apps/web
  Key file https://example.com/0f3c9a1e-7b2d-4c5e.txt: served ✓
  Sitemap URLs: 42

 Yandex: apps/web
  Host https://example.com/: verified ✓
  Sitemaps:
    https://example.com/sitemap.xml: added ✓
```

## Keys

`infra get` and `infra set` read `CLOUDFLARE_ACCOUNT_ID` and the account credentials from `env.global`. They read `APPLE_PRIVATE_KEY`, `MICROSOFT_CLIENT_SECRET` and `GITHUB_CLIENT_SECRET` per scope, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `MICROSOFT_GRAPH_API_TOKEN` and `YANDEX_WEBMASTER_TOKEN` from `global`. A missing key prints its fix line:

```console
infra set: apps/web: APPLE_PRIVATE_KEY has no prod value; run bun repo env set APPLE_PRIVATE_KEY --scope prod
```

## Worker commands

Five commands act on Workers, not products. They list Workers by name instead of taking `[name|--all]`.

```console
$ infra deploy --scope prod                  # the Worker at the current dir
$ infra deploy api web --scope dev --prune
$ infra logs-tail api --scope prod --minutes 5
$ infra logs-query api --view invocations --errors
$ infra observability-sync api --scope prod --apply
$ infra probe example.com
```

| Usage                                                                                                  | What it does |
| ------------------------------------------------------------------------------------------------------ | ------------ |
| `infra deploy [worker...] --scope dev\|prod [--prune]`                                                  | Deploys each Worker with `cf deploy`, then lists the secrets its config no longer declares. `--prune` deletes them. |
| `infra logs-tail <worker>... [--scope prod\|dev] [--minutes 15]`                                        | Tails every matched Worker at once. `--minutes 0` tails until killed. |
| `infra logs-query <worker>... [--scope prod\|dev] [--view events\|invocations\|traces\|calculations]`    | Queries Workers Observability and prints a summary. |
| `infra observability-sync <worker>... [--scope prod\|dev] [--apply]`                                    | Reports drift between each Worker's observability settings and its config; `--apply` patches them. |
| `infra probe [host]`                                                                                   | Probes TLS ALPN, HTTP/1.1, HTTP/2 SETTINGS and HTTP/3 on a live host. Asks for the host when none is given. |

`logs-tail` also takes the wrangler filters `--status`, `--method`, `--search`, `--header`, `--ip` and `--sampling-rate`. `logs-query` also takes `--minutes 60` or `--from <iso> [--to <iso>]`, `--errors`, `--needle text`, `--filter key<op>value`, `--group-by key` and `--limit 50`. `--scope` defaults to `prod` for the logs and observability commands; `deploy` requires it, and without it prints `usage: infra deploy [worker...] --scope dev|prod [--prune]` and exits 2. `infra probe` needs no Worker, product or credentials.

### Picking Workers

A selector is a product name (every Worker in it), a Worker package dir taken from the root, the package dir's base name, or the Worker's script name in the scope. A Worker picked twice runs once. `infra deploy` with no name deploys the Worker whose package holds the current dir. A selector that matches nothing stops the command with exit 1 and lists the Workers by base name:

```console
No worker matches "nope". Known:
  web-api (apps/web/api)
```

A selector that matches only Workers that never deploy to the scope stops the command too.

### Credentials

Each Worker runs with the env of the product that holds it, from `env.global` and the scope. A missing credential stops that Worker before any program runs:

```console
infra deploy: apps/web/api: CLOUDFLARE_ACCOUNT_EMAIL has no global value; run bun repo env set CLOUDFLARE_ACCOUNT_EMAIL --scope global
```

### Deploy secret flow

1. The product's credentials are read. A missing one fails before any program runs.
2. A Vite-built Worker runs its `build:<scope>` script first; a failed build stops the Worker before any secret is read.
3. The secrets its `cloudflare.config.ts` declares are read from the scope and written to a `0600` temp JSON file. `cf deploy --mode <scope> --secrets-file <file>` uploads them. The file is removed when `cf deploy` ends, however it ends. A Worker with no secrets gets no file.
4. `wrangler secret list` names the secrets the config does not declare. They are listed with `Run again with --prune to delete them.`; `--prune` deletes them.

A failing Worker prints `infra deploy: <dir>: <message>`; the rest still deploy, and the exit code is 1.

### Dumps

`logs-tail` and `logs-query` print a summary and keep the full response under the repo root in `.tmp/infra/<kind>/`:

- `.tmp/infra/tail/<stamp>-<scope>.ndjson`
- `.tmp/infra/query/<stamp>-<script>-<view>.json`

## Test runners

The commands refuse to run under `VITEST` or `NODE_ENV=test`, before any value is read.
