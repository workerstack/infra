import infra from "../infra.config.ts";

export default infra.worker("playground-api", {
  compatibilityDate: "2026-01-20",
  entrypoint: "./src/worker.ts",
  routes: ["example.com/api/*"],
  vars: ["GREETING"],
});
