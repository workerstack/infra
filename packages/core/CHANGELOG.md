# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `defineInfraConfig` with the Cloudflare zone schema and its defaults, and `discoverProducts` and `selectProducts`, which find each `infra.config.ts` under a repo root
- Infra configs take a defineEnv instance for credentials; `infra run` and `infra cf` run wrangler and cf with them.
- Cloudflare API client, zone and Access operations, and provisioning that returns new secrets as env writes
- `infra get`, `set`, `zone-get` and `zone-set`, with new secrets written through `bun repo env set`
- `cf-kit`, `infra gen`, and generated zone and locale redirects
- `infra deploy`, `logs-tail`, `logs-query`, `observability-sync` and `probe`
- `infra db-migrate` and `db-wipe` on the kit's migrations
- `infra loc` runs a product's Workers and apps behind one local edge
- `infra.worker` builds a Worker's whole `cloudflare.config.ts` from one call, and `infra gen` writes each database's `database.migrate.config.ts`
- `github.oauth`: `infra set` creates a GitHub sign-in App by the manifest flow in the browser, and `infra get` checks it
- IndexNow: `infra set` pushes the sitemaps' URLs to IndexNow after checking the key file, and Yandex: it adds each missing sitemap in Yandex Webmaster; `infra get` reports both

### Changed

- BREAKING: infra.config.ts is the product's one file: defineInfraConfig returns the config and the kit, createCfKit and *.cf-kit.ts are gone (a leftover kit file fails infra gen), the kit's options move to cloudflare.workers, and env.sealedKeys, local.vars and cloudflare.workers.ratelimitIds are optional (ratelimit-ids.json at the product root)
