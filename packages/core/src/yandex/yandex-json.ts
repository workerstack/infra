import type { YandexSession } from "./yandex-session.ts";

/** Calls `path` on the Webmaster API, a POST of `body` when given; throws naming the call when it fails. */
export async function yandexJson<T>(session: YandexSession, path: string, body?: { url: string }): Promise<T> {
  const method = body === undefined ? "GET" : "POST";
  const auth = { Authorization: `OAuth ${session.token}` };
  const headers = body === undefined ? auth : { ...auth, "Content-Type": "application/json; charset=utf-8" };

  const response = await session.fetcher(`${session.base}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  });

  if (!response.ok) {
    await response.body?.cancel();

    throw new Error(`yandex: ${method} ${path} answered ${String(response.status)}`);
  }

  return (await response.json()) /* the Webmaster API answers JSON */ as T;
}
