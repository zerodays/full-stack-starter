import type {
  QueryFunctionContext,
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

type Endpoint = (
  // biome-ignore lint/suspicious/noExplicitAny: must match any Hono client endpoint signature
  args: any,
  options?: ClientRequestOptions,
  // biome-ignore lint/suspicious/noExplicitAny: must match any Hono ClientResponse variant
) => Promise<ClientResponse<any, any, any>>;

type ErrorStatusCode = Exclude<ContentfulStatusCode, SuccessStatusCode>;

/** The success body — what `data` resolves to. */
export type SuccessOf<T> = InferResponseType<T, SuccessStatusCode>;

/**
 * The error channel, typed. Distributes over the error statuses the endpoint
 * can `return`, pairing each status with its body. A handler that returns
 * `apiError(c, 409, …)` makes this include `ApiError<409, { error: string }>`.
 * Add a `return apiError(c, 403, …)` and `ApiError<403, …>` appears here too.
 */
export type ApiErrorUnionOf<T> = {
  [Status in ErrorStatusCode]: InferResponseType<T, Status> extends never
    ? never
    : ApiError<Status, InferResponseType<T, Status>>;
}[ErrorStatusCode];

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
  const response = await endpoint(args, { init: { signal: opts?.signal } });

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

interface QueryEndpoint<T extends Endpoint> {
  call: T;
  queryOptions: (
    args: Omit<
      UseQueryOptions<SuccessOf<T>, ApiErrorUnionOf<T>>,
      "queryKey" | "queryFn"
    > &
      InputArg<T>,
  ) => {
    queryKey: QueryKey;
    queryFn: (context: QueryFunctionContext) => Promise<SuccessOf<T>>;
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
