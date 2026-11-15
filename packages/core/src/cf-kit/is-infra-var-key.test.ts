import { expect, it } from "vitest";

import { isInfraVarKey } from "./is-infra-var-key.ts";

it("is true for the vars infra resolves and false for any other key", () => {
  expect(isInfraVarKey("CF_ZONE_ID")).toBe(true);
  expect(isInfraVarKey("R2_BUCKET_NAME")).toBe(true);
  expect(isInfraVarKey("CF_API_TOKEN")).toBe(false);
  expect(isInfraVarKey("GREETING")).toBe(false);
});
