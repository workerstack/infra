/** Where `infra probe` prints and asks. */
export type ProbeIo = {
  error: (line: string) => void;
  isTTY: boolean;
  log: (line: string) => void;
  question: (prompt: string) => Promise<string>;
};
