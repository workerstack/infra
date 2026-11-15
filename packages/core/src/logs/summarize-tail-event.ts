import { clip } from "./clip.ts";
import { ISO_MILLIS_END, ISO_TIME_START, LEVEL_ERROR, LEVEL_LOG, LEVEL_WARN } from "./logs.constants.ts";
import type { TailEvent } from "./tail-event.ts";
import { tailLogLevel } from "./tail-log-level.ts";

function trigger(event: TailEvent["event"]): string {
  if (event?.request !== undefined) return `${event.request.method ?? "?"} ${event.request.url ?? "?"}`;

  if (event?.cron !== undefined) return `cron ${event.cron}`;

  if (event?.queue !== undefined) return `queue ${event.queue} x${event.batchSize ?? "?"}`;

  return "event";
}

function logLines(logs: NonNullable<TailEvent["logs"]>): string[] {
  return logs.flatMap((log) => {
    const text = (log.message ?? [])
      .map((part) => (part instanceof Object ? JSON.stringify(part) : String(part)))
      .join(" ");

    const level = log.level === LEVEL_LOG ? tailLogLevel(text) : log.level;

    return level === LEVEL_ERROR || level === LEVEL_WARN ? [`  ${level} ${clip(text)}`] : [];
  });
}

/** One headline per invocation plus its exceptions and warn or error logs, indented. */
export function summarizeTailEvent(event: TailEvent): string[] {
  const time = new Date(event.eventTimestamp ?? Date.now()).toISOString().slice(ISO_TIME_START, ISO_MILLIS_END);
  const status = event.event?.response?.status ?? "-";
  const head = `${time} ${event.scriptName ?? "?"} ${event.outcome ?? "?"} ${status} ${trigger(event.event)}`;
  const exceptions = (event.exceptions ?? []).map((ex) => `  ! ${ex.name ?? "Error"}: ${clip(ex.message ?? "")}`);

  return [`${head} wall=${event.wallTime ?? "?"}ms`, ...exceptions, ...logLines(event.logs ?? [])];
}
