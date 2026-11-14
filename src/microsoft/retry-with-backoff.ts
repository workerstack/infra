/** Runs `run` up to `maxAttempts` times, waiting `delayMs` between failures; the last failure throws. */
export async function retryWithBackoff<T>(run: () => Promise<T>, maxAttempts: number, delayMs: number): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (maxAttempts <= 1) throw error;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return retryWithBackoff(run, maxAttempts - 1, delayMs);
  }
}
