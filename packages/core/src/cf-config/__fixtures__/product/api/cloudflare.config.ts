import { defineConfig } from "cf/config";

import infra from "../infra.config.ts";

const LIMIT = 5;
const PERIOD = 60;

export default defineConfig(({ mode }) => {
  const scope = infra.scope(mode);

  return {
    worker: {
      ...infra.defaults,
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      env: {
        ...infra.d1(scope, "DB"),
        ...infra.ratelimits("web-api", scope, { name: "LIMIT_5", simple: { limit: LIMIT, period: PERIOD } }),
        ...infra.secrets("API_KEY"),
        ...infra.vars(scope, "GREETING", "SITE_URL"),
      },
      name: infra.name("web-api", scope),
      triggers: infra.routes(["example.com/api/*"], "example.com"),
    },
  };
});
