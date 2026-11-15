/**
 * Bi-directional drift split. `missing` = declared-but-not-live; `extra` = live-but-not-declared.
 * Membership uses natural-key equality.
 */
export type DriftSplit<T> = {
  declared: number;
  extra: T[];
  live: number;
  missing: T[];
};
