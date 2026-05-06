/**
 * Per-key serialization of async work (FIFO). Used to prevent concurrent fantasy lineup writes
 * from interleaving while DB transactions use row locks.
 */
export function createKeyedMutex() {
  const tails = new Map<string, Promise<unknown>>();

  return async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = tails.get(key) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    tails.set(
      key,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run as Promise<T>;
  };
}
