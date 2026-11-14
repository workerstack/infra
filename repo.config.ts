import { defineConfig } from "@workerstack/repo";

export default defineConfig({
  packs: ["agents", "standards", "docs"],
  agents: { hosts: ["claude", "codex", "antigravity", "grok", "cursor"] },
});
