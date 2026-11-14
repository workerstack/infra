/** Seconds per 365-day year: HSTS and cache lifetimes. */
const SECONDS_PER_YEAR = 31_536_000;

/** HSTS `max-age` default: two years, the preload list's recommendation. */
export const HSTS_MAX_AGE_S: number = 2 * SECONDS_PER_YEAR;
