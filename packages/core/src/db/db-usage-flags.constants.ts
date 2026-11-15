/** The flags `infra db-migrate` shows after `[name|--all]` in its usage line. */
export const DB_MIGRATE_USAGE_FLAGS: string = "[--scope dev|prod]";

/** The flags `infra db-wipe` shows after `[name|--all]` in its usage line. */
export const DB_WIPE_USAGE_FLAGS: string = "--scope dev|prod [--binding NAME...] [--force] [--dry-run]";
