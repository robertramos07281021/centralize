import { createClient } from 'graphql-ws';
import { store } from '../redux/store';

let wsClient: ReturnType<typeof createClient> | null = null;

export function getWsClient() {
  if (!wsClient) {
    const hostname = window.location.hostname;
    wsClient = createClient({
      url: `ws://${hostname}:3000/graphql`,
      connectionParams: () => {
        const token = store.getState().auth.myToken;
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
      lazy: true,
      retryAttempts: 3,
      shouldRetry: () => true,
    });
  }
  return wsClient;
}

export function closeWsClient() {
  if (wsClient) {
    wsClient.dispose();
    wsClient = null;
  }
}