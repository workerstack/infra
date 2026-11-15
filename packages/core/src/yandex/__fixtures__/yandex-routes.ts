import { type RouteAnswer, type RouteCall, routeFetch } from "../../index-now/__fixtures__/route-fetch.ts";

const API = "https://api.webmaster.yandex.net/v4";

/** The sitemaps path of host `https:example.com:443` for user 42. */
export const YANDEX_SITEMAPS = `${API}/user/42/hosts/https%3Aexample.com%3A443/user-added-sitemaps`;

function json(body: object, status = 200): RouteAnswer {
  return { body: JSON.stringify(body), status };
}

/** A fake Webmaster API: user 42, `hosts`, the host's `sitemaps`, and a POST that answers 201. */
export function yandexRoutes(options: { hosts?: object[]; sitemaps?: object[] }): ReturnType<typeof routeFetch> {
  const hosts = options.hosts ?? [
    { ascii_host_url: "https://example.com/", host_id: "https:example.com:443", verified: true },
  ];

  return routeFetch({
    [`GET ${API}/user`]: json({ user_id: 42 }),
    [`GET ${API}/user/42/hosts`]: json({ hosts }),
    [`GET ${YANDEX_SITEMAPS}`]: json({ sitemaps: options.sitemaps ?? [] }),
    [`POST ${YANDEX_SITEMAPS}`]: (call: RouteCall) => json({ sitemap_id: `id-${call.body}` }, 201),
  });
}
