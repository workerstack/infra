import { product } from "../../command/__fixtures__/test-host.ts";
import type { WorkerTarget } from "../../workers/worker-target.ts";

/** The Worker `web-api` in `apps/web/api`; `locale` lists the dirs its product's zone sends to their locale. */
export function fakeTarget(locale: string[] = []): WorkerTarget {
  const web = product("apps/web", {
    cloudflare: { bindings: {}, zone: { redirects: { locale } } } /* only the zone fields a deploy reads */ as never,
  });

  return {
    scriptName: "web-api-prod",
    worker: { baseName: "web-api", dir: "apps/web/api", packageDir: "/repo/apps/web/api", product: web, scopes: {} },
  };
}
