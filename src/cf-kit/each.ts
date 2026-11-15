/** Each name built from the one value; the keys are the caller's names. */
export function each<N extends string, V>(names: readonly N[], build: (name: N) => V): Record<N, V> {
  return Object.fromEntries(names.map((name) => [name, build(name)])) /* one entry per name */ as Record<N, V>;
}
