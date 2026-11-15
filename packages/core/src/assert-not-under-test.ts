import { isUnderTest } from "./is-under-test.ts";

const REFUSAL =
  "refusing the account's cloud credentials under a test runner (VITEST or NODE_ENV=test); " +
  "a test uses a fake instead";

/** Throws under a test runner, so a test never decrypts the account's credentials. */
export function assertNotUnderTest(base: Readonly<Record<string, string | undefined>>): void {
  if (isUnderTest(base)) throw new Error(REFUSAL);
}
