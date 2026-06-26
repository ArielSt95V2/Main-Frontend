import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { setAuth, logout } from "../features/authSlice";
import { Mutex } from "async-mutex";

const mutex = new Mutex();

/** Endpoints may attach traceId; stripped before fetch. */
type TraceableFetchArgs = FetchArgs & { traceId?: string };

function traceIdFromArg(arg: unknown): string | undefined {
  if (!arg || typeof arg !== "object") return undefined;

  if ("traceId" in arg) {
    const traceId = (arg as { traceId?: string }).traceId;
    if (typeof traceId === "string" && traceId) return traceId;
  }

  const headers = (arg as FetchArgs).headers;
  if (!headers) return undefined;

  if (headers instanceof Headers) {
    const id = headers.get("X-Request-ID");
    if (id) return id;
  } else if (Array.isArray(headers)) {
    const pair = headers.find(([key]) => key.toLowerCase() === "x-request-id");
    if (pair?.[1]) return pair[1];
  } else {
    const id = headers["X-Request-ID"] ?? headers["x-request-id"];
    if (typeof id === "string" && id) return id;
  }

  return undefined;
}

function withTraceHeader(arg: string | TraceableFetchArgs): string | FetchArgs {
  if (typeof arg === "string") return arg;

  const { traceId, ...rest } = arg;
  if (!traceId) return rest;

  const existing = rest.headers;
  if (existing instanceof Headers) {
    const headers = new Headers(existing);
    if (!headers.has("X-Request-ID")) {
      headers.set("X-Request-ID", traceId);
    }
    return { ...rest, headers };
  }

  const headers =
    typeof existing === "object" && existing !== null && !Array.isArray(existing)
      ? { ...existing, "X-Request-ID": traceId }
      : { "X-Request-ID": traceId };

  return { ...rest, headers };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include",
  prepareHeaders: (headers, { arg }) => {
    const traceId = traceIdFromArg(arg);
    if (traceId && !headers.has("X-Request-ID")) {
      headers.set("X-Request-ID", traceId);
    }
    return headers;
  },
});

const baseQuery: BaseQueryFn<
  string | TraceableFetchArgs,
  unknown,
  FetchBaseQueryError
> = (arg, api, extraOptions) =>
  rawBaseQuery(withTraceHeader(arg), api, extraOptions);

const baseQueryWithReauth: BaseQueryFn<
  string | TraceableFetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQuery(
          {
            url: "/jwt/refresh/",
            method: "POST",
          },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          api.dispatch(setAuth());

          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({}),
});
