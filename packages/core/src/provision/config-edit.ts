/** One text edit to a config file: `replacement` stands in for what `pattern` matches. Ids only, never secrets. */
export type ConfigEdit = {
  /** What to find: a regular expression, or a literal string. */
  pattern: RegExp | string;
  /** The text that replaces each match. */
  replacement: string;
};
