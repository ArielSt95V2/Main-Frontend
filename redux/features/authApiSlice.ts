import { apiSlice } from "../services/apiSlice";
import { traceRequestHeaders } from "@/lib/traceId";

interface User {
  first_name: string;
  last_name: string;
  email: string;
}

interface SocialAuthArgs {
  provider: string;
  state: string;
  code: string;
}

interface CreateUserResponse {
  success: boolean;
  user: User;
}

interface PairingResponse {
  pairing_code: string;
  expires_in: number;
}

interface RefreshResponse {
  access: string;
}

const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    retrieveUser: builder.query<User, void>({
      query: () => "/users/me/",
    }),
    socialAuthenticate: builder.mutation<CreateUserResponse, SocialAuthArgs>({
      query: ({ provider, state, code }) => ({
        url: `/o/${provider}/?state=${encodeURIComponent(
          state,
        )}&code=${encodeURIComponent(code)}`,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    }),
    login: builder.mutation({
      query: ({ email, password, traceId }) => ({
        url: "/jwt/create/",
        method: "POST",
        body: { email, password },
        headers: traceRequestHeaders(traceId),
        traceId,
      }),
    }),
    register: builder.mutation({
      query: ({ first_name, last_name, email, password, re_password, traceId }) => ({
        url: "/users/",
        method: "POST",
        body: { first_name, last_name, email, password, re_password },
        headers: traceRequestHeaders(traceId),
        traceId,
      }),
    }),
    verify: builder.mutation({
      query: () => ({
        url: "/jwt/verify/",
        method: "POST",
      }),
    }),
    logout: builder.mutation<void, { traceId: string }>({
      query: ({ traceId }) => ({
        url: "/logout/",
        method: "POST",
        headers: traceRequestHeaders(traceId),
        traceId,
      }),
    }),
    activation: builder.mutation({
      query: ({ uid, token }) => ({
        url: "/users/activation/",
        method: "POST",
        body: { uid, token },
      }),
    }),
    resetPassword: builder.mutation({
      query: (email) => ({
        url: "/users/reset_password/",
        method: "POST",
        body: { email },
      }),
    }),
    resetPasswordConfirm: builder.mutation({
      query: ({ uid, token, new_password, re_new_password }) => ({
        url: "/users/reset_password_confirm/",
        method: "POST",
        body: { uid, token, new_password, re_new_password },
      }),
    }),
    // Device pairing
    startPairing: builder.mutation<PairingResponse, { traceId: string }>({
      query: ({ traceId }) => ({
        url: "/pairing/start/",
        method: "POST",
        headers: traceRequestHeaders(traceId),
        traceId,
      }),
    }),
    refreshAccessToken: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: "/jwt/refresh/",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useRetrieveUserQuery,
  useSocialAuthenticateMutation,
  useLoginMutation,
  useRegisterMutation,
  useVerifyMutation,
  useLogoutMutation,
  useActivationMutation,
  useResetPasswordMutation,
  useResetPasswordConfirmMutation,
  useStartPairingMutation,
  useRefreshAccessTokenMutation,
} = authApiSlice;
