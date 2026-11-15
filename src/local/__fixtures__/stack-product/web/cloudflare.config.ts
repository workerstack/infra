import { defineConfig } from "cf/config";

import { kit } from "../stack.cf-kit.ts";

export default defineConfig(({ mode }) => {
  const env = kit.env(mode);

  return {
    worker: {
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      name: kit.name("stack-web", env),
      triggers: env === "prod" ? kit.routes(["example.com/app*"], "example.com") : [],
    },
  };
});
