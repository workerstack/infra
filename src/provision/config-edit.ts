/** One text edit to a config file: `replacement` stands in for what `pattern` matches. Ids only, never secrets. */
export type ConfigEdit = { pattern: RegExp | string; replacement: string };
