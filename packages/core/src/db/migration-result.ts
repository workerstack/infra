/** One binding's migration: what ran, and a note when it failed or was skipped. */
export type MigrationResult = {
  binding: string;
  databaseName: string;
  durationMs: number;
  migrationsApplied: number;
  note?: string;
  status: "applied" | "failed" | "noop" | "skipped";
};
