/** A binding field wrangler's type leaves optional but a Worker binding needs; a missing one fails naming it. */
export function requiredField(value: string | undefined, what: string): string {
  if (value === undefined) throw new Error(`infra has no ${what}`);

  return value;
}
