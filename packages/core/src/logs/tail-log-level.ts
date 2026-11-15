import { PINO_ERROR, PINO_LEVEL, PINO_WARN } from "./logs.constants.ts";

/** Our loggers emit pino-shaped JSON through `console.log`; level 40 is warn, 50 and up is error. */
export function tailLogLevel(text: string): string | undefined {
  const match = PINO_LEVEL.exec(text);

  if (match === null) return undefined;

  const level = Number(match[1]);

  if (level >= PINO_ERROR) return "error";

  return level >= PINO_WARN ? "warn" : undefined;
}
