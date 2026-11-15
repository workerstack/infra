/** The ALPN name of HTTP/2. */
export const ALPN_H2 = "h2";

/** The ALPN name of HTTP/1.1. */
export const ALPN_HTTP_1_1 = "http/1.1";

/** What the ALPN probe offers, in order. */
export const ALPN_OFFERED: readonly string[] = [ALPN_H2, ALPN_HTTP_1_1];

/** The most concurrent streams Chrome opens on one HTTP/2 connection. */
export const CHROME_MAX_CONCURRENT_STREAMS = 256;

/** The flags that print help. */
export const HELP_FLAGS: readonly string[] = ["--help", "-h"];

/** How long a TLS connect may take. */
export const CONNECT_TIMEOUT_MS = 10_000;

/** The seconds `curl --http3` may run. */
export const CURL_MAX_TIME_SEC = 10;

/** The port a host without one is probed on. */
export const DEFAULT_HTTPS_PORT = 443;

/** The end of an HTTP/1.1 header block. */
export const HEADER_BLOCK_END = "\r\n\r\n";

/** What `infra probe` asks for when no host is given. */
export const HOST_PROMPT = "Host: ";

/** The highest TCP port. */
export const MAX_PORT = 65_535;

/** What `infra probe --help` prints. */
export const PROBE_HELP: readonly string[] = [
  "usage: infra probe [host]",
  "Probes TLS ALPN, HTTP/1.1, HTTP/2 SETTINGS and HTTP/3 on a live host.",
  "With no host it asks for one.",
];

/** The usage line of `infra probe`. */
export const PROBE_USAGE = "usage: infra probe [host]";

/** How much of a reply that is not HTTP an error shows. */
export const RAW_PREVIEW_CHARS = 200;

/** How long a read from the server may take. */
export const READ_TIMEOUT_MS = 5_000;

/** The URL schemes a pasted host may carry. */
export const URL_PROTOCOLS: readonly string[] = ["http:", "https:"];
