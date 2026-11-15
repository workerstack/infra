import * as z from "zod";

import type { TailEvent } from "./tail-event.ts";

function tailEventSchema(): z.ZodType<TailEvent> {
  return z.looseObject({
    event: z
      .looseObject({
        batchSize: z.number().optional(),
        cron: z.string().optional(),
        queue: z.string().optional(),
        request: z.looseObject({ method: z.string().optional(), url: z.string().optional() }).optional(),
        response: z.looseObject({ status: z.number().optional() }).optional(),
      })
      .optional(),
    eventTimestamp: z.number().optional(),
    exceptions: z.array(z.looseObject({ message: z.string().optional(), name: z.string().optional() })).optional(),
    logs: z.array(z.looseObject({ level: z.string().optional(), message: z.array(z.unknown()).optional() })).optional(),
    outcome: z.string().optional(),
    scriptName: z.string().optional(),
    wallTime: z.number().optional(),
  });
}

/** Parses one event at the edge; extra fields stay on the result so the dump keeps them. */
export function parseTailEvent(raw: string): TailEvent {
  return tailEventSchema().parse(JSON.parse(raw));
}
