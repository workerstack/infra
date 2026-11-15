import { requiredGlobal } from "../credentials.ts";
import type { YandexSession } from "./yandex-session.ts";
import type { YandexTarget } from "./yandex-target.ts";
import { YANDEX_WEBMASTER_API } from "./yandex-webmaster-api.constants.ts";

/** The Webmaster session for a target; throws when the global token is missing. */
export function yandexSessionFor(target: YandexTarget): YandexSession {
  return {
    base: target.apiBase ?? YANDEX_WEBMASTER_API,
    fetcher: target.fetcher ?? fetch,
    token: requiredGlobal(target.env, "YANDEX_WEBMASTER_TOKEN"),
  };
}
