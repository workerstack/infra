import { DEV_VARS_HEADER, DEV_VARS_UNSAFE } from "./cf-config.constants.ts";

/**
 * A `.dev.vars` file of `values`, sorted, headed with the config it came from; `undefined` with no values. Wrangler
 * reads a double-quoted value verbatim unless it holds a quote, backslash or newline, so such a value fails.
 */
export function renderDevVars(values: Readonly<Record<string, string>>, file: string): string | undefined {
  const keys = Object.keys(values).toSorted();

  if (keys.length === 0) return undefined;

  const lines = keys.map((key) => {
    const value = values[key] ?? "";

    if (DEV_VARS_UNSAFE.test(value))
      throw new Error(`${file}: ${key}'s value has a quote, backslash or newline, which .dev.vars cannot hold`);

    return `${key}="${value}"`;
  });

  return `${DEV_VARS_HEADER}${file}\n${lines.join("\n")}\n`;
}
