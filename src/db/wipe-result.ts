/** One binding's wipe: what it emptied and dropped, and a note when it failed. */
export type WipeResult = {
  binding: string;
  databaseName: string;
  deleted: number;
  dropped: number;
  durationMs: number;
  note?: string;
  status: "dry-run" | "failed" | "noop" | "wiped";
};
