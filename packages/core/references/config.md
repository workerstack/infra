---
description: Config and product discovery
order: 20
---

# Config

An `infra.config.ts` describes one product's infrastructure, and it is the product's one file for it. It default-exports the result of `defineInfraConfig`, which checks the input, fills in defaults and builds the kit each Worker's `cloudflare.config.ts` imports (see Worker configs from one env).

```ts
import { defineInfraConfig } from "@workerstack/infra";
import { defineEnv } from "@workerstack/repo/env";

// Normally its own file (`web.env.ts`) that the config imports; the account credentials live in its `global` block.
const env = defineEnv({
  dev: {},
  global: { CLOUDFLARE_ACCOUNT_ID: "fedcba9876543210fedcba9876543210" },
  local: {},
  prod: {},
});

export default defineInfraConfig({
  env,
  cloudflare: {
    zone: { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" },
  },
  local: {
    host: "example.localhost",
    vars: (origin) => ({ APP_URL: origin.href }),
  },
});
```

`env` is any object with `global`, `local`, `dev` and `prod` views of string values, such as a `defineEnv` instance. `sealedKeys(scope)` names the keys sealed in a scope; a `defineEnv` instance has it, and a plain object can leave it out, so no key is sealed. `defineInfraConfig` never reads a value: the `env` it returns reads the given env key by key, and a command reads the credentials (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCOUNT_EMAIL`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_API_TOKEN`) when it runs. A secret field in the config is a type error.

The smallest product names a zone and an env with plain values:

```ts
import { defineInfraConfig } from "@workerstack/infra";

export default defineInfraConfig({
  cloudflare: { zone: { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" } },
  env: { dev: { GREETING: "hi dev" }, global: {}, local: { GREETING: "hi local" }, prod: { GREETING: "hi prod" } },
  local: { host: "example.localhost" },
});
```

## Workers

`cloudflare.workers` holds what the product's Workers share. Each field is optional:

- `defaults`: what every Worker's config spreads first (`...infra.defaults`).
- `migrations`: per D1 binding, its migrations (see Worker configs from one env).
- `localRemote`: the kinds (`d1_databases`, `r2_buckets`) whose bindings read their remote resource in `local`.
- `ratelimitIds`: the registry file of the limiters' namespace ids, used as given. Unset, it is `ratelimit-ids.json` at the product root.

```ts
import { defineInfraConfig } from "@workerstack/infra";

export default defineInfraConfig({
  cloudflare: {
    bindings: { local: { d1_databases: { DB: { database_id: "db-local-id", database_name: "db-local" } } } },
    workers: {
      defaults: { compatibilityDate: "2026-01-20" },
      localRemote: ["d1_databases"],
      migrations: { DB: { dir: "/repo/apps/web/db/migrations", owner: "web-api" } },
    },
    zone: { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" },
  },
  env: { dev: {}, global: {}, local: {}, prod: {} },
});
```

A migration for a binding the config does not declare is a type error.

## Local stack

`local` gives the product a local stack for `infra loc`: `host` is its local host, and `vars`, when given, maps the stack's origin to the URL vars each Worker's `.dev.vars.local` gets. With no `vars` the stack sets none.

`apps` lists the packages that run in their own `vite dev`, by dir relative to the product root:

```ts
import { defineInfraConfig } from "@workerstack/infra";
import { defineEnv } from "@workerstack/repo/env";

export default defineInfraConfig({
  env: defineEnv({ dev: {}, global: {}, local: {}, prod: {} }),
  local: { apps: ["web"], host: "example.localhost", vars: (origin) => ({ APP_URL: origin.origin }) },
});
```

Each dir must hold a `cloudflare.config.ts`. An empty, absolute, repeated or `..` dir fails `defineInfraConfig`. A package that depends on `@cloudflare/vite-plugin` and is not in `apps` is left out of the stack.

`@workerstack/infra/local` reads a running stack:

```ts
import { readLocalStack, subdomainOrigin } from "@workerstack/infra/local";

const productRoot = "apps/web";
const { origin } = readLocalStack(productRoot); // throws when no stack runs
subdomainOrigin(new URL(origin), "api"); // http://api.example.localhost
```

`findLocalStack` returns `undefined` instead of throwing, `localStackPath` names the state file, and `WORKER_HEADER` is the header the edge names a Worker in.

## GitHub sign-in

`github.oauth` declares one GitHub App per scope for signing users in. `infra set` creates each app whose `clientId` is `"STUB"` in the browser and writes its client id back (see the GitHub browser step in commands). Its client secret is `GITHUB_CLIENT_SECRET` in that scope of the env.

```ts
import { defineInfraConfig } from "@workerstack/infra";

export default defineInfraConfig({
  env: { dev: {}, global: {}, local: {}, prod: {} },
  github: {
    oauth: {
      prod: {
        appName: "Example App",
        clientId: "STUB",
        homepageUrl: "https://example.com",
        redirectOrigins: ["https://example.com"],
      },
    },
  },
});
```

| Field             | What it is                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `appName`         | The app's name on GitHub. Its slug is the name lowercased, each run of other characters a dash. |
| `clientId`        | `"STUB"` until `infra set` creates the app.                                                     |
| `homepageUrl`     | The app's homepage.                                                                             |
| `redirectOrigins` | Each origin's `/v1/auth/oauth/github/callback` is a callback URL.                              |
| `org`             | The organization that owns the app. Unset, the signed-in user owns it.                          |
| `public`          | Whether accounts outside the owner can sign in. `true` when unset; a private app signs in only the owning organization's members. |

The app asks only to read email addresses, and its webhook is off.

## IndexNow

`indexNow` pushes the URLs of the product's sitemaps to IndexNow, which shares them with Bing, Yandex and the other engines that take it. The key is public, so it lives in the config: 8 to 128 letters, digits and dashes. Any other key fails `defineInfraConfig`, naming it. `host` defaults to the zone domain.

```ts
import { defineInfraConfig } from "@workerstack/infra";

export default defineInfraConfig({
  env: { dev: {}, global: {}, local: {}, prod: {} },
  indexNow: { host: "example.com", key: "0f3c9a1e-7b2d-4c5e", sitemapUrls: ["https://example.com/sitemap.xml"] },
});
```

The product serves the key at `https://{host}/{key}.txt`, with the key as the whole body. A static asset does it, such as `public/0f3c9a1e-7b2d-4c5e.txt` holding `0f3c9a1e-7b2d-4c5e`. `infra set` fetches that file first and fails when it is missing or holds something else:

```console
infra set: apps/web: indexNow: https://example.com/0f3c9a1e-7b2d-4c5e.txt does not serve the key; serve a file there that holds it
```

Then it reads each sitemap, following a sitemap index one level down, keeps each `<loc>` on the host and POSTs them to `https://api.indexnow.org/indexnow`, at most 10,000 at a time. It logs each response code with its meaning: 200 ok, 202 key pending, 400 bad format, 403 bad key, 422 off-host urls, 429 too many. Any code but 200 and 202 fails.

## Yandex sitemaps

`yandex.webmaster` adds the product's sitemaps to its host in Yandex Webmaster. `hostUrl` defaults to `https://{zone domain}`. The host must already be added and verified in Webmaster; a missing or unverified host fails, naming it.

```ts
import { defineInfraConfig } from "@workerstack/infra";

export default defineInfraConfig({
  env: { dev: {}, global: {}, local: {}, prod: {} },
  yandex: { webmaster: { hostUrl: "https://example.com", sitemapUrls: ["https://example.com/sitemap.xml"] } },
});
```

`infra set` lists the host's sitemaps and adds each one that is missing, so a rerun adds nothing. The OAuth token is `YANDEX_WEBMASTER_TOKEN` in `global`; seal it. To get one, register an app at `https://oauth.yandex.com` with the Webmaster permissions `webmaster:hostinfo` and `webmaster:verify`, open `https://oauth.yandex.com/authorize?response_type=token&client_id=<app id>` signed in as the host's owner, and store the token the page shows:

```console
$ bun repo env set YANDEX_WEBMASTER_TOKEN --scope global
```

## Products

A product is one `infra.config.ts`. Its name is its directory relative to the repo root, or `.` at the root.

`discoverProducts` finds every config under a root. `selectProducts` picks from them by target.

```ts
import { discoverProducts, selectProducts } from "@workerstack/infra";

const root = process.cwd();
const products = await discoverProducts(root);

selectProducts(root, products, undefined); // the only product, else an error
selectProducts(root, products, { all: true }); // every product
selectProducts(root, products, { name: "apps/web" }); // one product by name
```

The result is `{ ok: true, products }` or `{ ok: false, error }`.
