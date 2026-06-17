/**
 * Error raised at the client seam when the backend returns a non-ok response.
 *
 * The backend `return`s its expected errors as values (`apiError(c, 409, …)`),
 * so they live in the Hono RPC type. `safeFetch` re-throws them as `ApiError`
 * so they flow through TanStack's error channel — while the status code and
 * body shape stay typed (see `ApiErrorUnionOf` in `typed-client.ts`).
 */
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ApiError<
  Status extends ContentfulStatusCode = ContentfulStatusCode,
  Body = unknown,
> extends Error {
  readonly status: Status;
  readonly body: Body;

  constructor(status: Status, body: Body) {
    super(`API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;
