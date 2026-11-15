import { expect, it } from "vitest";

import { parseDeployScope } from "./parse-deploy-scope.ts";

it("answers dev and prod, and nothing for another value", () => {
  expect([parseDeployScope("dev"), parseDeployScope("prod")]).toStrictEqual(["dev", "prod"]);
  expect([parseDeployScope("local"), parseDeployScope("staging"), parseDeployScope(undefined)]).toStrictEqual([
    undefined,
    undefined,
    undefined,
  ]);
});
