import { PINO_LEVEL_NAMES } from "./logs.constants.ts";
import type { TelemetryEvent } from "./telemetry-event.ts";

/** `$metadata.level`, else our logger's pino-numeric `source.level`. */
export function levelOf(event: TelemetryEvent): string | undefined {
  if (event.$metadata?.level !== undefined) return event.$metadata.level;

  const { source } = event;

  if (!(source instanceof Object)) return undefined;

  return PINO_LEVEL_NAMES.find(([number]) => number === source.level)?.[1];
}
