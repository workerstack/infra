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
