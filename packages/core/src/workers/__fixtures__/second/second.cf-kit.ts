import { join } from "node:path";

import { createCfKit } from "../../../cf-kit/create-cf-kit.ts";
import { fakeInfraEnv } from "../../../shared/__fixtures__/fake-infra-env.ts";
import { defineInfraConfig } from "../../../define-infra-config.ts";

/** A second product's kit: no bindings, one Worker. */
export const kit = createCfKit({
  config: defineInfraConfig({ env: fakeInfraEnv() }),
  ratelimitIds: join(import.meta.dirname, "ratelimit-ids.json"),
});
