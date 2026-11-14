---
description: Get and set commands
order: 50
---

# Commands

Four commands check and change what a product's config describes. Each takes `[name|--all]`.

```console
$ infra get              # the product holding the current dir, else the only product
$ infra get web          # by product name (its dir)
$ infra get --all
$ infra set web
$ infra zone-get web
$ infra zone-set web
```

| Command         | What it does                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `infra get`     | Reports the live Cloudflare account and zone, then Google, Apple and Microsoft, against the config. Changes nothing. |
| `infra set`     | Provisions bindings, Access and AI Search, applies the zone, then applies Google, Apple and Microsoft.            |
| `infra zone-get`| Reports the zone: rules, drift, declared bindings, R2, AI Search and Turnstile.                                   |
| `infra zone-set`| Applies the zone settings only. Zone redirects are not applied yet.                                               |

## Target

- A name picks the product whose directory has that name, as `infra.config.ts` discovery names it.
- `--all` runs every product.
- With no name, the product holding the current directory runs. Outside every product the only product runs; with two or more, the command stops:

```console
infra get: 2 products; name one or pass --all: apps/admin, apps/web
```

An extra argument or an unknown flag prints `usage: infra get [name|--all]` and exits 2.

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

## Test runners

The commands refuse to run under `VITEST` or `NODE_ENV=test`, before any value is read.
