import { clip } from "./clip.ts";
import type { LoggedSource } from "./logged-source.ts";

function firstFrame(stack: string | undefined): string | undefined {
  return stack
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("at ") && !line.includes("<anonymous>"));
}

/** Our loggers put the thrown error on `source.err`: its name, message, cause and the first app frame. */
export function errorDetail(source: LoggedSource | string | undefined): string {
  const err = source instanceof Object ? source.err : undefined;

  if (err === undefined) return "";

  const parts = [
    `${err.name ?? "Error"}: ${err.message ?? ""}`,
    err.errorKey === undefined ? undefined : `key=${err.errorKey}`,
    err.cause?.message === undefined ? undefined : `cause: ${err.cause.message}`,
    firstFrame(err.stack),
  ].filter((part) => part !== undefined);

  return ` — ${clip(parts.join(" | "))}`;
}
