import { expect, it } from "vitest";

import { INFRA_SCOPES } from "./infra-scopes.constants.ts";
import { LOCAL_SCOPE } from "./local-scope.constants.ts";

it("is one of the infra scopes, and the first a command visits", () => {
  expect(INFRA_SCOPES[0]).toBe(LOCAL_SCOPE);
});
