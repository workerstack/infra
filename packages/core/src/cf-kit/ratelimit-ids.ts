import { existsSync, readFileSync } from "node:fs";

import { stringifyJson } from "../shared/jsonc.ts";
import { writeAtomic } from "../shared/write-atomic.ts";

/**
 * Worker base name → scope → limiter name → namespace_id. Committed beside the product's kit, so an id once given
 * never changes and its counters survive every later generation.
 */
export type RatelimitRegistry = Record<string, Record<string, Record<string, number>>>;

type Allocation = { file: string; name: string; scope: string; worker: string };

type Entry<T> = [string, T];

function byKey<T>([a]: Entry<T>, [b]: Entry<T>): number {
  return Number(a > b) - Number(a < b);
}

function sortedEntries<T>(record: Record<string, T>, sort: (value: T) => T): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record)
      .toSorted(byKey)
      .map(([key, value]) => [key, sort(value)]),
  );
}

// Keys sorted at every level, the order the repo's JSON gate wants committed.
function sorted(registry: RatelimitRegistry): RatelimitRegistry {
  return sortedEntries(registry, (scopes) => sortedEntries(scopes, (names) => sortedEntries(names, (id) => id)));
}

export function readRegistry(file: string): RatelimitRegistry {
  if (!existsSync(file)) return {};

  return JSON.parse(readFileSync(file, "utf8")) /* the file is the registry this module wrote */ as RatelimitRegistry;
}

/**
 * Gives one limiter the next id above every id in the registry and writes the registry. It reads the file now, not
 * at start, so an id another `infra gen` just took is not given twice.
 */
export function allocateRatelimitId(input: Allocation): number {
  const registry = readRegistry(input.file);
  const existing = registry[input.worker]?.[input.scope]?.[input.name];

  if (existing !== undefined) return existing;

  const taken = Object.values(registry).flatMap((scopes) =>
    Object.values(scopes).flatMap((names) => Object.values(names)),
  );

  const id = Math.max(0, ...taken) + 1;
  const scopes = (registry[input.worker] ??= {});

  (scopes[input.scope] ??= {})[input.name] = id;
  writeAtomic(input.file, stringifyJson(sorted(registry)));

  return id;
}
