import infra from "../infra.config.ts";

export default infra.worker("stack-api", (scope) => ({
  compatibilityDate: "2026-01-20",
  entrypoint: "./src/index.ts",
  ...(scope === "prod" && { routes: ["example.com/api/*"] }),
}));
