import { clip } from "./clip.ts";
import { errorDetail } from "./error-detail.ts";
import { levelOf } from "./level-of.ts";
import { ISO_MILLIS_END, ISO_MONTH_START } from "./logs.constants.ts";
import type { TelemetryEvent } from "./telemetry-event.ts";

function messageOf(event: TelemetryEvent): string {
  if (event.$metadata?.message !== undefined) return event.$metadata.message;

  const { source } = event;

  if (source === undefined) return "";

  return source instanceof Object ? JSON.stringify(source) : source;
}

function outcomeOf(workers: NonNullable<TelemetryEvent["$workers"]>): string {
  if (workers.outcome === undefined) return "";

  const status = workers.event?.response?.status;
  const shown = status === undefined || status === 0 ? "" : ` ${status}`;

  return ` ${workers.outcome}${shown} wall=${workers.wallTimeMs ?? "?"}ms`;
}

/** One greppable line for an event: time, level, outcome and status, message and the logged error. */
export function eventLine(event: TelemetryEvent): string {
  const time = new Date(event.timestamp ?? 0).toISOString().slice(ISO_MONTH_START, ISO_MILLIS_END);
  const level = levelOf(event) ?? "?";

  return `${time} ${level}${outcomeOf(event.$workers ?? {})} ${clip(messageOf(event))}${errorDetail(event.source)}`;
}
