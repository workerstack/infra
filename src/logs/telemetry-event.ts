import type { LoggedSource } from "./logged-source.ts";

/** One telemetry event: the fields a summary reads. */
export type TelemetryEvent = {
  $metadata?: { level?: string; message?: string; requestId?: string; trigger?: string };
  $workers?: { event?: { response?: { status?: number } }; outcome?: string; wallTimeMs?: number };
  source?: LoggedSource | string | undefined;
  timestamp?: number;
};
