# workerstack/infra

Bun workspace for the `@workerstack/infra` package.

| Package | Path | |
| --- | --- | --- |
| `@workerstack/infra` | [`packages/core`](packages/core) | Cloudflare infrastructure as code for workerstack repos |
| `@workerstack/infra-playground` | [`packages/playground`](packages/playground) | A product that runs on the package, for checking it by running it |

Compiler options are in `tsconfig.base.json`; each package's `tsconfig.json` extends it.

```sh
bun install
bun run typecheck   # the root and every package
bun run test
bun run build
bun repo ci         # every gate
```
