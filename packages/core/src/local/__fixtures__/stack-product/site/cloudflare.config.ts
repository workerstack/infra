import { defineConfig } from "cf/config";

import infra from "../infra.config.ts";

export default defineConfig(({ mode }) => {
  const scope = infra.scope(mode);

  return {
    worker: {
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      name: infra.name("stack-site", scope),
      triggers: scope === "prod" ? infra.routes(["site.example.com/*"], "example.com") : [],
    },
  };
});
