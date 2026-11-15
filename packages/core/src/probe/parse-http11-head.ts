import type { Http11Head } from "./http11-head.ts";
import { LINE_BREAK } from "./probe-patterns.constants.ts";
import { HEADER_BLOCK_END, RAW_PREVIEW_CHARS } from "./probe.constants.ts";

/** The status line, alt-svc and lowercase-named headers of an HTTP/1.1 reply; a reply that is not HTTP throws. */
export function parseHttp11Head(raw: string): Http11Head {
  const [statusLine, ...lines] = (raw.split(HEADER_BLOCK_END)[0] ?? raw).split(LINE_BREAK);

  if (statusLine === undefined || !statusLine.startsWith("HTTP/"))
    throw new Error(`No HTTP status line in response:\n${raw.slice(0, RAW_PREVIEW_CHARS)}`);

  const headers: Record<string, string> = {};

  for (const line of lines) {
    const colon = line.indexOf(":");

    if (colon > 0) headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
  }

  return { altSvc: headers["alt-svc"] ?? null, headers, statusLine };
}
