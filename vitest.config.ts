import { defineConfig } from "@workerstack/repo/vitest";

export default defineConfig({
  test: {
    include: ["bin/**/*.test.ts", "cli/**/*.test.ts", "src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
