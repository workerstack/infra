import { defineConfig } from "@workerstack/repo";

export default defineConfig({
  packs: ["agents", "standards", "docs", "release"],
  owner: { github: "lovrozagar", name: "Lovro Žagar" },
  coverage: { mutate: ["packages/core/bin/**/*.ts", "packages/core/cli/**/*.ts", "packages/core/src/**/*.ts"] },
  lint: {
    skip: [
      {
        files: ["packages/core/src/local/dispatcher.worker.ts"],
        rules: ["import/no-default-export"],
        reason: "a Worker module's fetch handler is its default export, the only entrypoint `wrangler dev` serves",
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
