---
description: Credentials from defineEnv
order: 30
---

# Credentials

Account credentials live in the product's env file, not in `infra.config.ts`. The config passes the env object. A command reads the credentials only when it runs.

```ts
// apps/web/web.env.ts
import { defineEnv, sealed } from "@workerstack/repo/env";

export const env = defineEnv({
  dev: {},
  global: {
    CLOUDFLARE_ACCOUNT_ID: "fedcba9876543210fedcba9876543210",
    CLOUDFLARE_ACCOUNT_EMAIL: "ops@example.com",
    CLOUDFLARE_API_KEY: sealed("…"),
    CLOUDFLARE_API_TOKEN: sealed("…"),
  },
  local: {},
  prod: {},
});
```

```ts
// apps/web/infra.config.ts
import { defineInfraConfig } from "@workerstack/infra";
import { defineEnv } from "@workerstack/repo/env";

// Normally imported from `./web.env.ts`.
const env = defineEnv({ dev: {}, global: { CLOUDFLARE_ACCOUNT_ID: "fedcba9876543210fedcba9876543210" }, local: {}, prod: {} });

export default defineInfraConfig({
  env,
  cloudflare: { zone: { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" } },
});
```

Write a sealed value with `bun repo env set CLOUDFLARE_API_KEY --scope global`. The `env` field is typed `InfraEnv`: any object with `global`, `local`, `dev` and `prod` views of string values (`InfraScope` names the last three). A key read per scope, such as an Access secret, is missing when its view has no value: `ACCESS_GOOGLE_CLIENT_SECRET has no prod value; run bun repo env set ACCESS_GOOGLE_CLIENT_SECRET --scope prod`.

## Keys

| Key                        | Needed by                 |
| -------------------------- | ------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`    | `infra run`, `infra cf`   |
| `CLOUDFLARE_ACCOUNT_EMAIL` | `infra run`, `infra cf`   |
| `CLOUDFLARE_API_KEY`       | `infra run`, `infra cf`   |
| `CLOUDFLARE_API_TOKEN`     | `infra cf`                |

An empty string counts as missing.

## Commands

`infra run <dir> <command> [args...]` finds the product that holds `<dir>`. It runs the command with the wrangler credentials of that product. A token from your shell never leaks in.

`infra cf [args...]` finds the product that holds the current directory. It runs `cf` with that product's credentials. It returns the exit code of the child.

`cf` is a peer package. Install it with `bun add -d cf`.

## Errors

A missing key prints one line:

```console
infra run: CLOUDFLARE_API_KEY has no global value; run bun repo env set CLOUDFLARE_API_KEY --scope global
```

## Test runners

Both commands refuse to run when `VITEST` is set or `NODE_ENV` is `test`. The guard runs before any value is read, so a test never decrypts a secret. A test uses a fake instead.
