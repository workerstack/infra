import { bindings, defineConfig, defineContainer, exports } from "cf/config";

import { kit } from "../stack.cf-kit.ts";

export default defineConfig(({ mode }) => {
  const env = kit.env(mode);
  const name = kit.name("stack-box", env);
  const container = defineContainer({ image: { reference: "registry.example/box:1" }, maxInstances: 1, name });

  return {
    containers: [container],
    worker: {
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      env: { BOX: bindings.durableObject({ exportName: "Box", worker: name }) },
      exports: { Box: exports.durableObject({ container, storage: "sqlite" }) },
      name,
      triggers: env === "prod" ? kit.routes(["example.com/box*"], "example.com") : [],
    },
  };
});
