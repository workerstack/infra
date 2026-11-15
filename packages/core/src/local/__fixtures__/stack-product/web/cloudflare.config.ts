import infra from "../infra.config.ts";

export default infra.worker("stack-web", (scope) => ({
  compatibilityDate: "2026-01-20",
  entrypoint: "./src/index.ts",
  ...(scope === "prod" && { routes: ["example.com/app*"] }),
}));
