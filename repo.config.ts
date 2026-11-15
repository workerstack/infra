import { defineConfig } from "@workerstack/repo";

export default defineConfig({
  packs: ["agents", "standards", "docs", "release"],
  link: { push: "allow" },
  owner: { github: "lovrozagar", name: "Lovro Žagar" },
  coverage: { mutate: ["packages/core/bin/**/*.ts", "packages/core/cli/**/*.ts", "packages/core/src/**/*.ts"] },
  agents: {
    defaultApproval: "ask",
    defaultEffort: "fast",
    defaultStrategy: "spawn-fast",
    hosts: ["claude", "codex", "antigravity", "grok", "cursor"],
  },
  workflow: "main",
});
