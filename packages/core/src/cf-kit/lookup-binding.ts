import type { EnvBindings } from "../schema/bindings.ts";
import type { InfraConfig, InfraScope } from "../schema/infra.ts";

type BindingKind = Exclude<keyof EnvBindings, "ai_search_instances">;

type Lookup<B extends BindingKind> = { config: InfraConfig; kind: B; name: string; scope: InfraScope };

/** The binding `name` of one kind in one scope's infra bindings; a missing one names the scope, kind and binding. */
export function lookupBinding<B extends BindingKind>(input: Lookup<B>): NonNullable<EnvBindings[B]>[string] {
  const found = input.config.cloudflare?.bindings[input.scope]?.[input.kind]?.[input.name];

  if (found === undefined) throw new Error(`infra has no ${input.scope} ${input.kind} binding ${input.name}`);

  return found /* the lookup is by `kind`, so it is that kind's binding */ as NonNullable<EnvBindings[B]>[string];
}
