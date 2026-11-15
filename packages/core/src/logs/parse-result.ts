/** What a command's arguments came to: help asked for, a message to print, or the parsed arguments. */
export type ParseResult<T> = { kind: "help" } | { kind: "error"; message: string } | { args: T; kind: "run" };
