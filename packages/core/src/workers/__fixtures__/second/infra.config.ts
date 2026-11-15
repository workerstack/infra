import { defineInfraConfig } from "../../../define-infra-config.ts";
import { fakeInfraEnv } from "../../../shared/__fixtures__/fake-infra-env.ts";

export default defineInfraConfig({ env: fakeInfraEnv() });
