// `rawHeaders` lists each header as a name then its value.
const RAW_HEADER_STRIDE = 2;

/** A response head for a raw socket, from Node's flat name, value, name, value list. */
export function rawHead(status: number, message: string, rawHeaders: readonly string[]): string {
  const lines = [`HTTP/1.1 ${status} ${message}`];

  for (let at = 0; at < rawHeaders.length; at += RAW_HEADER_STRIDE)
    lines.push(`${rawHeaders[at] ?? ""}: ${rawHeaders[at + 1] ?? ""}`);

  return `${lines.join("\r\n")}\r\n\r\n`;
}
