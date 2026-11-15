---
description: Install the package
order: 10
---

# @workerstack/infra

```sh
bun add -d @workerstack/infra
```

This package manages a product's Cloudflare setup from its `infra.config.ts`: zones, Access, Worker configs generated from one env, deploys, logs, D1 migrations and a local stack. Credentials come from `@workerstack/repo/env`.

Commands, run as `infra <command>`:

- [`infra get`](#commands-1): report the live account and zone against the config.
- [`infra set`](#commands-1): provision bindings and Access, then apply the zone.
- [`infra zone-get`](#commands-1): report the zone, its rules and drift.
- [`infra zone-set`](#commands-1): apply the zone settings and redirects.
- [`infra gen`](#commands-1): write each Worker's wrangler config and `.dev.vars`.
- [`infra db-migrate`](#databases): apply each D1 binding's migrations.
- [`infra db-wipe`](#databases): empty each D1 binding's tables.
- [`infra loc`](#local-stack-1): run a product's Workers and apps behind one local edge.
- [`infra deploy`](#worker-commands): deploy Workers and list stale secrets.
- [`infra logs-tail`](#worker-commands): tail Worker logs.
- [`infra logs-query`](#worker-commands): query Workers Observability.
- [`infra observability-sync`](#worker-commands): report or fix observability drift.
- [`infra probe`](#worker-commands): probe TLS and HTTP versions on a live host.
- [`infra run`](#commands): run a command with a product's wrangler credentials.
- [`infra cf`](#commands): run `cf` with a product's credentials.
- `infra version`: print the package version.
