# @workerstack/infra-playground

A small product that runs on `@workerstack/infra`, for checking the package by running it: one `api` Worker, plain fake vars, no Cloudflare account and no key.

```sh
cd packages/playground
bun run gen   # writes api/.cloudflare/ and api/.dev.vars.local
bun run loc   # then open http://playground.localhost/api/hello
```

It consumes the package the way a product does: `workspace:*`, imports through the exports (`@workerstack/infra`) and the `infra` bin, so it runs the built `dist/`, not `src/`. Both scripts build `packages/core` first.

`bun run loc` serves the Worker behind the local edge on `playground.localhost` (port 80, or a free port when 80 is taken; the output prints the URL). Ctrl-C stops it and removes `.wrangler/loc/stack.json`.

The product's files: `infra.config.ts` (zone, env, local host), `kit.cf-kit.ts` (the kit), `config.ts` (the values), `api/` (the Worker: `cloudflare.config.ts`, `wrangler.config.ts`, `src/worker.ts`). `.cloudflare/`, `.dev.vars*` and `.wrangler/` are generated and gitignored.

`infra get`, `set`, `deploy` and `logs` talk to a real account, so they need real credentials in the env's `global` block and a real zone id. This product has neither. See `packages/core/references/commands.md`.
