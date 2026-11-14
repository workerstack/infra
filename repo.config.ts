import { defineConfig } from "@workerstack/repo";

export default defineConfig({
  packs: ["agents", "standards", "docs", "release"],
  owner: { github: "lovrozagar", name: "Lovro Žagar" },
  coverage: { mutate: ["bin/**/*.ts", "cli/**/*.ts"] },
  agents: { hosts: ["claude", "codex", "antigravity", "grok", "cursor"] },
});
