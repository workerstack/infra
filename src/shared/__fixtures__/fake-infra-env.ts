import type { InfraEnv, InfraScope } from "../../schema/infra.ts";

type Views = Partial<Record<InfraScope | "global", Readonly<Record<string, string | undefined>>>>;

/** An env with the given views (missing ones are empty); `sealed` lists the keys sealed in every scope. */
export function fakeInfraEnv(views: Views = {}, sealed: readonly string[] = []): InfraEnv {
  return {
    dev: views.dev ?? {},
    global: views.global ?? {},
    local: views.local ?? {},
    prod: views.prod ?? {},
    sealedKeys: () => new Set(sealed),
  };
}
