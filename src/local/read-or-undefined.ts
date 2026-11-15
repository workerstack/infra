/** What `read` returns, or `undefined` when it throws: a /proc entry that is gone or another user's. */
export function readOrUndefined<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}
