import { defineConfig } from "cf/config";

import { kit } from "../web.cf-kit.ts";

const LIMIT = 5;
const PERIOD = 60;

export default defineConfig(({ mode }) => {
  const env = kit.env(mode);

  return {
    worker: {
      ...kit.defaults,
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      env: {
        ...kit.d1(env, "DB"),
        ...kit.ratelimits("web-api", env, { name: "LIMIT_5", simple: { limit: LIMIT, period: PERIOD } }),
        ...kit.secrets("API_KEY"),
        ...kit.vars(env, "GREETING", "SITE_URL"),
      },
      name: kit.name("web-api", env),
      triggers: kit.routes(["example.com/api/*"], "example.com"),
    },
  };
});
