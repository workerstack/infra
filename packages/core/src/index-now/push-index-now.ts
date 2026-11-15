import { HTTP_STATUS } from "../http-status.constants.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { INDEX_NOW_CHUNK } from "./index-now-chunk.constants.ts";
import { INDEX_NOW_CODES } from "./index-now-codes.constants.ts";
import type { IndexNowTarget } from "./index-now-target.ts";
import { INDEX_NOW_URL } from "./index-now-url.constants.ts";
import { keyFileUrl } from "./key-file-url.ts";

async function postChunk(target: IndexNowTarget, urlList: string[]): Promise<void> {
  const fetcher = target.fetcher ?? fetch;
  const { host } = target;
  const body = JSON.stringify({ host, key: target.config.key, keyLocation: keyFileUrl(target), urlList });

  const response = await fetcher(target.apiUrl ?? INDEX_NOW_URL, {
    body,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    method: "POST",
  });

  await response.body?.cancel();

  const code = String(response.status);
  const meaning = INDEX_NOW_CODES.find(([each]) => each === response.status)?.[1] ?? "unexpected";

  (target.log ?? stdoutLog)(`  POST ${String(urlList.length)} URLs → ${code} ${meaning}`);

  if (response.status !== HTTP_STATUS.OK && response.status !== HTTP_STATUS.ACCEPTED)
    throw new Error(`indexNow: IndexNow answered ${code} (${meaning})`);
}

/** POSTs `urls` to IndexNow in chunks of at most 10,000, one after another; a code but 200 or 202 throws. */
export async function pushIndexNow(target: IndexNowTarget, urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  await postChunk(target, urls.slice(0, INDEX_NOW_CHUNK));
  await pushIndexNow(target, urls.slice(INDEX_NOW_CHUNK));
}
