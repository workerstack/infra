import { PEM_NOISE } from "./pem-noise.constants.ts";

/** The DER bytes of a PEM key; the BEGIN and END lines are optional. */
export function pemToBuffer(pem: string): ArrayBuffer {
  const binary = atob(pem.replaceAll(PEM_NOISE, ""));
  const buffer = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) buffer[index] = binary.codePointAt(index) ?? 0;

  return buffer.buffer;
}
