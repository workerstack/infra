import { defineConfig } from "cf/config";

import infra from "../infra.config.ts";

export default defineConfig(({ mode }) => {
  const scope = infra.scope(mode);

  return {
    worker: {
      ...infra.defaults,
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      name: infra.name("docs-site", scope),
      observability: { enabled: true, headSamplingRate: 0.5 },
    },
  };
});
