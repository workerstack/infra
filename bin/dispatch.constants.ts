/** Where the user's arguments start in `process.argv`, after the runtime and the script. */
export const ARGV_START: number = 2;

/** A command is a lowercase word with dashes; anything else never reaches an import. */
export const COMMAND_NAME: RegExp = /^[a-z][a-z0-9-]*$/;
