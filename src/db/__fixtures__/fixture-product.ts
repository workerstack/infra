import { join } from "node:path";

import config from "../../../test/__fixtures__/product/infra.config.ts";
import type { Product } from "../../products.ts";

/** The directory of the fixture product, whose kit gives its `DB` migrations the database `main`. */
export const FIXTURE_ROOT: string = join(import.meta.dirname, "../../../test/__fixtures__/product");

/** The fixture product as `apps/web`. */
export function fixtureProduct(): Product {
  return { config, configFile: join(FIXTURE_ROOT, "infra.config.ts"), name: "apps/web", root: FIXTURE_ROOT };
}
