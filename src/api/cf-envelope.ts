import * as z from "zod";

/** A Cloudflare API response: `success`, the `result` and the error messages. */
export type CfEnvelope = {
  errors: { message: string }[];
  result?: unknown;
  success: boolean;
};

function envelopeSchema(): z.ZodType<CfEnvelope> {
  return z.object({
    errors: z.array(z.object({ message: z.string() })).default([]),
    result: z.unknown().optional(),
    success: z.boolean(),
  });
}

/** Parses a response body at the edge; a body that is not an envelope throws. */
export async function readEnvelope(response: Response): Promise<CfEnvelope> {
  return envelopeSchema().parse(await response.json());
}

/** The error messages of a failed envelope, joined for the error line. */
export function errorMessages(envelope: CfEnvelope): string {
  return envelope.errors.map(({ message }) => message).join(", ");
}
