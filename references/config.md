---
description: Config and product discovery
order: 20
---

# Config

An `infra.config.ts` describes one product's infrastructure. It default-exports the result of `defineInfraConfig`, which checks the input and fills in defaults.

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

`env` is any object with `global`, `local`, `dev` and `prod` views of string values, such as a `defineEnv` instance. `defineInfraConfig` keeps it as given and never reads a value; a command reads the credentials (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCOUNT_EMAIL`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_API_TOKEN`) when it runs. A secret field in the config is a type error.

## Local stack

`local` gives the product a local stack for `infra loc`: `host` is its local host, and `vars` maps the stack's origin to the URL vars each Worker's `.dev.vars.local` gets.

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
