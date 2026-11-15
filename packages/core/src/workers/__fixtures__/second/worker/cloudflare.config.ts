import infra from "../infra.config.ts";

export default infra.worker("docs-site", {
  compatibilityDate: "2026-01-20",
  entrypoint: "./src/index.ts",
  extra: () => ({ observability: { enabled: true, headSamplingRate: 0.5 } }),
});
