import { defineProject } from "@workerstack/repo/vitest";

export default defineProject({
  test: {
    include: ["bin/**/*.test.ts", "cli/**/*.test.ts", "src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
