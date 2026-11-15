/** Minutes a tail runs when `--minutes` is not given. */
export const TAIL_DEFAULT_MINUTES = 15;

/** The wrangler tail filters `infra logs-tail` forwards as they are. */
export const TAIL_PASS_THROUGH = ["status", "method", "search", "header", "ip", "sampling-rate"] as const;

/** What `infra logs-tail --help` and a bad argument print. */
export const TAIL_USAGE: readonly string[] = [
  "usage: infra logs-tail <worker>... [--scope prod|dev] [--minutes 15]",
  "       [--status ok|error|canceled] [--method GET] [--search text] [--header k:v] [--ip addr] [--sampling-rate 0.5]",
  "Tails every matched Worker at once.",
  "Full events go to .tmp/infra/tail/<stamp>-<scope>.ndjson; one line per event on stdout.",
  "--minutes 0 tails until killed. Run it in the background, reproduce, then grep the dump.",
];
