---
description: Product and Worker commands
order: 50
---

# Commands

Five commands check, change and generate what a product's config describes; five more act on Workers, below. Each takes `[name|--all]`.

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
| `infra get`     | Reports the live Cloudflare account and zone, then Google, Apple and Microsoft, against the config. Changes nothing. |
| `infra set`     | Provisions bindings, Access and AI Search, applies the zone and its redirects, then applies Google, Apple and Microsoft.            |
| `infra zone-get`| Reports the zone: rules, drift, declared bindings, R2, AI Search and Turnstile.                                   |
| `infra zone-set`| Applies the zone settings and the generated zone and locale redirects only.                                      |
| `infra gen`     | Writes each Worker package's `.cloudflare/wrangler.<scope>.json` and `.dev.vars.<scope>`. `--check` writes nothing and fails on drift. |

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

## Secret flow

`infra set` writes ids and secrets to different places.

- A new id (a D1 database, a KV namespace, a Microsoft client id) is written into `infra.config.ts` by one file write.
- A new secret never touches the config. The Turnstile secret key, the Access service token secret and a new Microsoft client secret go to `bun repo env set KEY --scope S --file F`, with the value on stdin. `F` is the env file under the product that calls `defineEnv(` and exports the config's `env`.

Each secret prints one line:

```console
wrote TURNSTILE_SECRET_KEY (prod) with bun repo env set
```

A product with no such env file stops with `no env file under apps/web exports the config's env; define it with defineEnv beside infra.config.ts`.

Microsoft adds a client secret only when the scope has no `MICROSOFT_CLIENT_SECRET`. A scope that has one gets none, so a rerun adds nothing.

Ids and secrets found before a step fails are still written.

## Keys

`infra get` and `infra set` read `CLOUDFLARE_ACCOUNT_ID` and the account credentials from `env.global`. They read `APPLE_PRIVATE_KEY` and `MICROSOFT_CLIENT_SECRET` per scope, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and `MICROSOFT_GRAPH_API_TOKEN` from `global`. A missing key prints its fix line:

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
