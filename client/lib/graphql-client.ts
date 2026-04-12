import { GraphQLClient } from "graphql-request";
import { createClient as createWsClient } from "graphql-ws";
import { tokenStorage, API_URL } from "./api";

const GQL_URL = `${API_URL}/graphql`;
const GQL_WS_URL = GQL_URL.replace(/^http/, "ws");

// HTTP client (queries + mutations)
// graphql-request sends POST /graphql with {query, variables}
// We pass a function for headers so the token is read fresh on every request
// after a silent refresh replaces the stored token

export const gqlClient = new GraphQLClient(GQL_URL, {
  headers: () => {
    const token = tokenStorage.getAccess();

    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  },
});

//   WebSocket Client
// graphql-ws opens one persistent WebSocket and multiplexes all
// subscriptions over it. connectionParams sends the token on connect

export const wsClient = createWsClient({
  url: GQL_WS_URL,
  connectionParams: () => {
    const token = tokenStorage.getAccess();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  retryAttempts: Infinity,
  shouldRetry: () => true,
});

// Subscription helper
// Returns a cleanup function - call it to unsubscribe

export function subscribe<T>(
  query: string,
  variables: Record<string, unknown>,
  onData: (data: T) => void,
  onError?: (err: Error) => void,
): () => void {
  const cleanup = wsClient.subscribe<T>(
    { query, variables },
    {
      next: ({ data }) => data && onData(data),
      error: (err) => onError?.(err as Error),
      complete: () => {},
    },
  );
  return cleanup;
}
