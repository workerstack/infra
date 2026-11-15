/** The parts of an HTTP/1.1 reply head the probe uses. */
export type Http11Head = { altSvc: string | null; headers: Record<string, string>; statusLine: string };
