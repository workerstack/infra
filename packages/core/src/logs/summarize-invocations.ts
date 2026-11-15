import { clip } from "./clip.ts";
import { eventLine } from "./event-line.ts";
import { levelOf } from "./level-of.ts";
import { LEVEL_ERROR, LEVEL_FATAL, LEVEL_WARN } from "./logs.constants.ts";
import type { TelemetryEvent } from "./telemetry-event.ts";

function isProblem(event: TelemetryEvent): boolean {
  const level = levelOf(event);

  return level === LEVEL_ERROR || level === LEVEL_FATAL || level === LEVEL_WARN;
}

/** One line per request, then its warn, error and fatal events indented. */
export function summarizeInvocations(invocations: Record<string, TelemetryEvent[]>): string[] {
  return Object.entries(invocations).flatMap(([requestId, events]) => {
    const sorted = events.toSorted((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const head = sorted.find((event) => event.$workers?.outcome !== undefined) ?? sorted[0];
    const title = `${requestId} ${clip(head?.$metadata?.trigger ?? "?")} → ${head?.$workers?.outcome ?? "?"}`;

    return [`${title} (${events.length} events)`, ...sorted.filter(isProblem).map((event) => `  ${eventLine(event)}`)];
  });
}
