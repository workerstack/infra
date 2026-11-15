import { defineConfig } from "@workerstack/repo";

export default defineConfig({
  packs: ["agents", "standards", "docs", "release"],
  owner: { github: "lovrozagar", name: "Lovro Žagar" },
  coverage: { mutate: ["packages/core/bin/**/*.ts", "packages/core/cli/**/*.ts", "packages/core/src/**/*.ts"] },
  agents: {
    defaultApproval: "away",
    defaultEffort: "fast",
    defaultStrategy: "spawn-fast",
    hosts: ["claude", "codex", "antigravity", "grok", "cursor"],
  },
});
