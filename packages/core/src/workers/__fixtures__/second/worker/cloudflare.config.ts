import { defineConfig } from "cf/config";

import { kit } from "../second.cf-kit.ts";

export default defineConfig(({ mode }) => {
  const env = kit.env(mode);

  return {
    worker: {
      ...kit.defaults,
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      name: kit.name("docs-site", env),
      observability: { enabled: true, headSamplingRate: 0.5 },
    },
  };
});
