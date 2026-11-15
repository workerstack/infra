import type { DbScope } from "./db-scope.ts";

/** The scopes a database command runs in. */
export const DB_SCOPES: readonly DbScope[] = ["dev", "prod"];

/** The scope `infra db-migrate` runs in when none is given, and the one a wipe needs `--force` for. */
export const PROD_SCOPE: DbScope = "prod";
