import { bindings, defineConfig, defineContainer, exports } from "cf/config";

import infra from "../infra.config.ts";

export default defineConfig(({ mode }) => {
  const scope = infra.scope(mode);
  const name = infra.name("stack-box", scope);
  const container = defineContainer({ image: { reference: "registry.example/box:1" }, maxInstances: 1, name });

  return {
    containers: [container],
    worker: {
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      env: { BOX: bindings.durableObject({ exportName: "Box", worker: name }) },
      exports: { Box: exports.durableObject({ container, storage: "sqlite" }) },
      name,
      triggers: scope === "prod" ? infra.routes(["example.com/box*"], "example.com") : [],
    },
  };
});
