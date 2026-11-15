import { defineConfig } from "@workerstack/repo/vitest";

export default defineConfig({
  test: {
    projects: ["packages/core"],
  },
});
