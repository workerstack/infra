import { defineConfig } from "cf/config";

import { kit } from "../kit.cf-kit.ts";

export default defineConfig(({ mode }) => {
  const env = kit.env(mode);

  return {
    worker: {
      ...kit.defaults,
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/worker.ts",
      env: { ...kit.vars(env, "GREETING") },
      name: kit.name("playground-api", env),
      triggers: kit.routes(["example.com/api/*"], "example.com"),
    },
  };
});
