/** Throw from deep async code; route handlers catch and map to Fastify reply. */
export class HttpReplyError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpReplyError";
  }
}
