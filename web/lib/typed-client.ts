import type {
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import type {
  ClientRequestOptions,
  ClientResponse,
  InferRequestType,
  InferResponseType,
} from "hono/client";
import type {
  ContentfulStatusCode,
  SuccessStatusCode,
} from "hono/utils/http-status";
import { ApiError } from "./api-error";

/**
 * Any Hono client endpoint (`$get`, `$post`, …). `never` parameters make this
 * the supertype of every endpoint signature (parameters are contravariant);
 * `safeFetch` owns the one cast back to the concrete input type.
 */
type Endpoint = (
  args: never,
  options?: ClientRequestOptions,
) => Promise<ClientResponse<unknown, number>>;

/** The success body — what `data` resolves to. */
export type SuccessOf<T> = InferResponseType<T, SuccessStatusCode>;

/**
 * One `ApiError` per error response variant. Hono types an endpoint's return
 * as a union of `ClientResponse<Body, Status>` — one member per `return` in
 * the handler — so distributing over it pairs each error status with its body.
 *
 * A statusless `c.json(x)` is typed with the whole `ContentfulStatusCode`
 * union instead of a literal; the first branch drops those so a success body
 * never masquerades as an error variant.
 */
type ErrorResponseOf<Response> =
  Response extends ClientResponse<infer Body, infer Status extends number>
    ? ContentfulStatusCode extends Status
      ? never
      : Status extends SuccessStatusCode
        ? never
        : ApiError<Status, Body>
    : never;

/**
 * The typed error channel. A handler that `return apiError(c, 409, …)` makes
 * this include `ApiError<409, { error: string }>`; add a `return apiError(c,
 * 403, …)` and `ApiError<403, …>` appears here too. Endpoints that declare no
 * error responses fall back to bare `ApiError` — guard 401s, `onError` 500s,
 * and other unexpected failures still throw at runtime. (Transport failures
 * bypass this entirely and surface as `TypeError`.)
 */
export type ApiErrorUnionOf<T extends Endpoint> = [
  ErrorResponseOf<Awaited<ReturnType<T>>>,
] extends [never]
  ? ApiError
  : ErrorResponseOf<Awaited<ReturnType<T>>>;

/**
 * Call a raw Hono endpoint, narrow on `response.ok`, and either return the
 * typed success body or throw a typed `ApiError`. This is the seam where
 * Hono's return-grain becomes TanStack's throw-grain.
 */
async function safeFetch<T extends Endpoint>(
  endpoint: T,
  args: InferRequestType<T>,
  opts?: { signal?: AbortSignal },
): Promise<SuccessOf<T>> {
  // `Endpoint` erases the parameter to `never`; the concrete type is `args`'s.
  const response = await endpoint(args as never, {
    init: { signal: opts?.signal },
  });

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, body);
  }

  return (await response.json()) as SuccessOf<T>;
}

type InputArg<T> =
  // biome-ignore lint/complexity/noBannedTypes: "no input" is genuinely the empty object here
  {} extends InferRequestType<T>
    ? { input?: undefined }
    : { input: InferRequestType<T> };

/**
 * `queryOptions` / `mutationOptions` take TanStack passthrough options and
 * return the fully typed options object. Declaring the *return* type as
 * `UseQueryOptions<Data, Error>` (not a bare `{ queryKey, queryFn }`) is
 * load-bearing: `useQuery`/`useMutation` infer `TError` only from the declared
 * type of the options they receive — there is no tag- or throw-based error
 * inference on the hook side.
 */
interface QueryEndpoint<T extends Endpoint> {
  call: T;
  queryOptions: (
    args: Omit<
      UseQueryOptions<SuccessOf<T>, ApiErrorUnionOf<T>>,
      "queryKey" | "queryFn"
    > &
      InputArg<T>,
  ) => UseQueryOptions<SuccessOf<T>, ApiErrorUnionOf<T>> & {
    queryKey: QueryKey;
    queryFn: QueryFunction<SuccessOf<T>>;
  };
  mutationOptions: <TContext = unknown>(
    args: Omit<
      UseMutationOptions<
        SuccessOf<T>,
        ApiErrorUnionOf<T>,
        InferRequestType<T>,
        TContext
      >,
      "mutationKey" | "mutationFn"
    >,
  ) => UseMutationOptions<
    SuccessOf<T>,
    ApiErrorUnionOf<T>,
    InferRequestType<T>,
    TContext
  > & {
    mutationKey: QueryKey;
    mutationFn: (input: InferRequestType<T>) => Promise<SuccessOf<T>>;
  };
}

function buildEndpoint<T extends Endpoint>(
  endpoint: T,
  path: string[],
): QueryEndpoint<T> {
  return {
    call: endpoint,
    queryOptions(args) {
      const { input, ...rest } = args;
      return {
        ...rest,
        queryKey: [path, { type: "query", input }],
        queryFn: ({ signal }) =>
          safeFetch(endpoint, (input ?? {}) as InferRequestType<T>, { signal }),
      };
    },
    mutationOptions(args) {
      return {
        ...args,
        mutationKey: [path, { type: "mutation" }],
        mutationFn: (input) => safeFetch(endpoint, input),
      };
    },
  };
}

type TypedClient<T> = {
  [K in keyof T]: T[K] extends Endpoint
    ? QueryEndpoint<T[K]>
    : T[K] extends object
      ? TypedClient<T[K]>
      : T[K];
};

const HTTP_METHODS = ["$get", "$post", "$put", "$patch", "$delete"];

/**
 * Wrap a Hono RPC client so each endpoint exposes `queryOptions` /
 * `mutationOptions` with clean success `data` and a typed `ApiError` channel.
 */
export function hcQueryTyped<T extends object>(client: T): TypedClient<T> {
  const proxy = (target: T, path: string[] = []): TypedClient<T> =>
    new Proxy(target, {
      get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver);
        if (typeof property !== "string" || property === "then") return value;

        const nextPath = [...path, property];
        if (HTTP_METHODS.includes(property)) {
          return buildEndpoint(value as Endpoint, nextPath);
        }
        return proxy(value as T, nextPath);
      },
    }) as TypedClient<T>;

  return proxy(client);
}
