import { expect, test } from "vitest";

import { parseDeployArgs } from "./parse-deploy-args.ts";

test("workers, the scope and --prune come in any order", () => {
  expect(parseDeployArgs(["web", "--prune", "--scope", "prod", "docs"])).toStrictEqual({
    prune: true,
    scope: "prod",
    selectors: ["web", "docs"],
  });
  expect(parseDeployArgs(["--scope", "dev"])).toStrictEqual({ prune: false, scope: "dev", selectors: [] });
});

test.each([[[]], [["web"]], [["--scope"]], [["--scope", "local"]], [["--scope", "prod", "--force"]]])(
  "%j is not a deploy",
  (args: string[]) => {
    expect(parseDeployArgs(args)).toBeUndefined();
  },
);
