import infra from "../infra.config.ts";

const LIMIT = 5;
const PERIOD = 60;

export default infra.worker("web-api", {
  compatibilityDate: "2026-01-20",
  d1: ["DB"],
  entrypoint: "./src/index.ts",
  ratelimits: [{ name: "LIMIT_5", simple: { limit: LIMIT, period: PERIOD } }],
  routes: ["example.com/api/*"],
  secrets: (env) => [env.API_KEY],
  vars: (env) => [env.GREETING, env.SITE_URL],
});
