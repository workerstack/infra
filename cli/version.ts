import pkg from "../package.json" with { type: "json" };

export function main(_args: readonly string[]): Promise<number> {
  process.stdout.write(`${pkg.version}\n`);

  return Promise.resolve(0);
}
