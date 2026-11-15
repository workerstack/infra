/** A running `wrangler tail`: its two output streams as text, its exit code and a way to stop it. */
export type TailChild = {
  exited: Promise<number>;
  kill: () => void;
  stderr: AsyncIterable<string>;
  stdout: AsyncIterable<string>;
};
