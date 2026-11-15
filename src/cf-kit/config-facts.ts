import type { CfKit } from "./cf-kit.ts";
import type { KitContext } from "./kit-context.ts";

type Facts = Pick<CfKit, "localeApps" | "localHost" | "localUrlVars" | "zoneDomain">;

/** What the product's config says about its zone and local stack. */
export function configFacts(context: KitContext): Facts {
  const { cloudflare, local } = context.config;

  return {
    localHost: local?.host,
    localUrlVars: (origin) => (local === undefined ? {} : local.vars(new URL(origin ?? `http://${local.host}`))),
    localeApps: cloudflare?.zone.redirects.locale ?? [],
    zoneDomain: cloudflare?.zone.domain,
  };
}
