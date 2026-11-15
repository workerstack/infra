/** A line `bun pm pack --dry-run` prints per file: `packed 1.0KB path`. */
export const PACKED_LINE: RegExp = /^packed \S+ (.+)$/gm;

/** The shebang line `Bun.Transpiler` cannot scan. */
export const SHEBANG: RegExp = /^#!.*\n/;

/** A specifier that points at a file next to the importer. */
export const RELATIVE_SPECIFIER: RegExp = /^\.\.?\//;

/** Loaded by path, so no import names it: src/local/write-dispatcher.ts spawns it. */
export const PATH_LOADED: readonly string[] = ["src/local/dispatcher.worker.ts"];

/** How long packing and scanning may take. */
export const PACK_TIMEOUT_MS: number = 60_000;
