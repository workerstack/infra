import { TEST_NODE_ENV } from "./test-node-env.constants.ts";

/** Whether a test runner runs the process: `VITEST` is set or `NODE_ENV` is `test`. */
export function isUnderTest(base: Readonly<Record<string, string | undefined>>): boolean {
  return (base.VITEST !== undefined && base.VITEST !== "") || base.NODE_ENV === TEST_NODE_ENV;
}
