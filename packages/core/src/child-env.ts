/** An env for a child process: names to values, `undefined` for a name left out. */
export type ChildEnv = Readonly<Record<string, string | undefined>>;
