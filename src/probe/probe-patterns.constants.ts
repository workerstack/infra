/** `[::1]` or `[::1]:8443`: the address and the port. */
export const BRACKET_HOST: RegExp = /^\[([0-9a-fA-F:]+)\](?::(\d{1,5}))?$/;

/** The curl feature names that mean HTTP/3. */
export const CURL_HTTP3: RegExp = /\bHTTP3\b|\bnghttp3\b/i;

/** What an old curl says about `--http3`. */
export const CURL_HTTP3_UNKNOWN: RegExp = /option --http3: is unknown/i;

/** A line break, either kind. */
export const LINE_BREAK: RegExp = /\r?\n/;

/** `api.example.com` or `api.example.com:8443`: the name and the port. */
export const PLAIN_HOST: RegExp = /^([A-Za-z0-9.-]+)(?::(\d{1,5}))?$/;

/** Slashes at the end of a pasted host. */
export const TRAILING_SLASHES: RegExp = /\/+$/;
