import { defineConfig } from "@workerstack/repo";

export default defineConfig({
  packs: ["agents", "standards", "docs", "release"],
  owner: { github: "lovrozagar", name: "Lovro Žagar" },
  coverage: { mutate: ["packages/core/bin/**/*.ts", "packages/core/cli/**/*.ts", "packages/core/src/**/*.ts"] },
  lint: {
    skip: [
      {
        files: ["packages/core/src/local/dispatcher.worker.ts", "packages/playground/api/src/worker.ts"],
        rules: ["import/no-default-export"],
        reason: "a Worker module's fetch handler is its default export, the only entrypoint `wrangler dev` serves",
      },
    ],
  },
  knip: {
    ignore: [
      {
        file: "packages/playground/infra.config.ts",
        reason: "infra gen and infra loc discover it by name; nothing imports it",
      },
      {
        file: "packages/playground/api/cloudflare.config.ts",
        reason: "infra gen finds each Worker by its cloudflare.config.ts",
      },
      {
        file: "packages/playground/api/wrangler.config.ts",
        reason: "infra gen reads it by name beside the Worker's cloudflare.config.ts",
      },
      {
        file: "packages/playground/api/src/worker.ts",
        reason: "the Worker's entrypoint in cloudflare.config.ts is a path string",
      },
    ],
  },
  agents: {
    defaultApproval: "away",
    defaultEffort: "fast",
    defaultStrategy: "spawn-fast",
    hosts: ["claude", "codex", "antigravity", "grok", "cursor"],
  },
});
