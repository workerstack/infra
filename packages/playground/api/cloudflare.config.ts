import { defineConfig } from "cf/config";

import infra from "../infra.config.ts";

export default defineConfig(({ mode }) => {
  const scope = infra.scope(mode);

  return {
    worker: {
      ...infra.defaults,
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/worker.ts",
      env: { ...infra.vars(scope, "GREETING") },
      name: infra.name("playground-api", scope),
      triggers: infra.routes(["example.com/api/*"], "example.com"),
    },
  };
});
