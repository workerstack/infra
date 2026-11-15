import { yandexJson } from "./yandex-json.ts";
import type { YandexSession } from "./yandex-session.ts";

type Host = { ascii_host_url: string; host_id: string; verified: boolean };

function isHost(host: Host, hostUrl: string): boolean {
  return URL.canParse(host.ascii_host_url) && new URL(host.ascii_host_url).href === hostUrl;
}

/** The API path of the verified host whose URL is `hostUrl`; throws naming a host that is missing or unverified. */
export async function yandexHostPath(session: YandexSession, hostUrl: string): Promise<string> {
  const { user_id: userId } = await yandexJson<{ user_id: number }>(session, "/user");
  const { hosts } = await yandexJson<{ hosts?: Host[] }>(session, `/user/${String(userId)}/hosts`);

  const host = hosts?.find((each) => isHost(each, hostUrl));

  if (host === undefined)
    throw new Error(`yandex: host ${hostUrl} is not in Yandex Webmaster; add it there and verify it`);

  if (!host.verified) throw new Error(`yandex: host ${hostUrl} is not verified in Yandex Webmaster; verify it there`);

  return `/user/${String(userId)}/hosts/${encodeURIComponent(host.host_id)}`;
}
