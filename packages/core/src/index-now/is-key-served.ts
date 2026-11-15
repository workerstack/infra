import type { IndexNowTarget } from "./index-now-target.ts";
import { keyFileUrl } from "./key-file-url.ts";

/** Whether the key file answers ok with the key as its body. */
export async function isKeyServed(target: IndexNowTarget): Promise<boolean> {
  const fetcher = target.fetcher ?? fetch;
  const response = await fetcher(keyFileUrl(target), {});
  const body = await response.text();

  return response.ok && body.trim() === target.config.key;
}
