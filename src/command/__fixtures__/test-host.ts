import type { Product } from "../../products.ts";
import type { InfraConfig } from "../../schema/infra.ts";
import type { CommandHost } from "../command-host.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

/** A product named `name` under `/repo/<name>` with `config`. */
export function product(name: string, config: Partial<InfraConfig> = {}): Product {
  const env = fakeInfraEnv({ global: { CLOUDFLARE_ACCOUNT_ID: "acc" } });
  const root = `/repo/${name}`;

  return { config: { env, ...config }, configFile: `${root}/infra.config.ts`, name, root };
}

/** A host over `products` at `cwd` that records what it printed; `guard` fails with `blocked` when given. */
export function testHost(
  products: Product[],
  cwd = "/repo",
  blocked?: string,
): { err: string[]; host: CommandHost; out: string[] } {
  const err: string[] = [];
  const out: string[] = [];

  const host: CommandHost = {
    cwd,
    discover: () => Promise.resolve(products),
    guard: () => {
      if (blocked !== undefined) throw new Error(blocked);
    },
    root: () => "/repo",
    stderr: (line) => err.push(line),
    stdout: (line) => out.push(line),
  };

  return { err, host, out };
}
