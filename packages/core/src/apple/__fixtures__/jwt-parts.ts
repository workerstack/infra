/** The decoded header and claims of a compact JWT. */
export function jwtParts(jwt: string): { claims: Record<string, unknown>; header: Record<string, unknown> } {
  const [header = "", claims = ""] = jwt.split(".");

  return { claims: decode(claims), header: decode(header) };
}

function decode(part: string): Record<string, unknown> {
  const text = atob(part.replaceAll("-", "+").replaceAll("_", "/"));

  return JSON.parse(text) as Record<string, unknown> /* a JWT segment is a JSON object */;
}
