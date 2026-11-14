import { importAppleKey } from "./import-apple-key.ts";

/** Whether `privateKey` imports as an Apple signing key. */
export async function isAppleKeyValid(privateKey: string): Promise<boolean> {
  try {
    await importAppleKey(privateKey);

    return true;
  } catch {
    return false;
  }
}
