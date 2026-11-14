# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `defineInfraConfig` with the Cloudflare zone schema and its defaults, and `discoverProducts` and `selectProducts`, which find each `infra.config.ts` under a repo root
- Infra configs take a defineEnv instance for credentials; infra run and infra cf run wrangler and cf with them.
- Cloudflare API client zone and Access operations and provisioning that returns new secrets as env writes
- infra get set zone-get and zone-set with new secrets written through bun repo env set
