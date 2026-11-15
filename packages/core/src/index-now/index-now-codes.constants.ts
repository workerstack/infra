/** What each IndexNow response code means; only 200 and 202 pass. */
export const INDEX_NOW_CODES = [
  [200, "ok"],
  [202, "key pending"],
  [400, "bad format"],
  [403, "bad key"],
  [422, "off-host urls"],
  [429, "too many"],
] as const;
