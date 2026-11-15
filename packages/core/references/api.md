---
description: Cloudflare API client
order: 40
---

# API client

`createClient(auth, zoneId)` returns a `CfClient`: one `request(method, path, body)` call that parses Cloudflare's response envelope and returns its `result`. A failed envelope throws one line.

```console
CF API GET /zones/abc/dns_records: Invalid zone identifier
```

## accountAuth and CfAuth

`accountAuth(env)` reads the account credentials from `env.global` when it is called. It returns a `CfAuth`: the API token when `CLOUDFLARE_API_TOKEN` is set, else the account email with its global key. A missing key throws the fix line from [credentials](credentials.md).

```ts
import { accountAuth, createClient } from "@workerstack/infra";
import type { CfAuth, CfClient } from "@workerstack/infra";
import { defineEnv } from "@workerstack/repo/env";

const env = defineEnv({
  dev: {},
  global: {
    CLOUDFLARE_ACCOUNT_EMAIL: "ops@example.com",
    CLOUDFLARE_ACCOUNT_ID: "fedcba9876543210fedcba9876543210",
    CLOUDFLARE_API_KEY: "example-key",
  },
  local: {},
  prod: {},
});

const auth: CfAuth = accountAuth(env);
const client: CfClient = createClient(auth, "0123456789abcdef0123456789abcdef");

export const records = client.request<object[]>("GET", `/zones/${client.zoneId}/dns_records`);
```

## InfraScope

`InfraScope` is `"local" | "dev" | "prod"`. A per-scope secret is read from the env view of that name.

```ts
import type { InfraScope } from "@workerstack/infra";

export const scopes: InfraScope[] = ["local", "dev", "prod"];
```

## SecretWrite and ConfigEdit

Provisioning returns two kinds of change. A `ConfigEdit` is a text edit to a config file, for an id only: a D1 `database_id`, a KV `id`, a Turnstile `siteKey` or an Access `clientId`. A `SecretWrite` is a secret to put in the env under `key` for `scope`, such as `TURNSTILE_SECRET_KEY` or `ACCESS_SERVICE_TOKEN_CLIENT_SECRET`. A secret is never part of an edit.

```ts
import type { ConfigEdit, SecretWrite } from "@workerstack/infra";

export const edit: ConfigEdit = { pattern: 'siteKey: "STUB",', replacement: 'siteKey: "0x4AAAAAAAexample",' };
export const secret: SecretWrite = { key: "TURNSTILE_SECRET_KEY", scope: "prod", value: "example-secret" };
```

Write each secret with `bun repo env set <key> --scope <scope>`.
