/** What a TLS connection is made with: the ALPN names offered, the endpoint and the connect timeout. */
export type TlsConnect = { alpn: readonly string[]; host: string; port: number; timeoutMs: number };
