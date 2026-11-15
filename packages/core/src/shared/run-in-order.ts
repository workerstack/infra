/** Runs `run` for each item one after another, in order; Cloudflare calls must not overlap. */
export async function runInOrder<T>(items: T[], run: (item: T) => Promise<void>): Promise<void> {
  const [first, ...rest] = items;

  if (first === undefined) return;

  await run(first);
  await runInOrder(rest, run);
}
