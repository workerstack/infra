/**
 * One file `infra gen` owns: the text it should hold, or `undefined` when a generated one should be gone. With a
 * `header`, an existing file that does not start with it is hand-written, and gen refuses to touch it.
 */
export type PlannedFile = { file: string; header?: string; text: string | undefined };
