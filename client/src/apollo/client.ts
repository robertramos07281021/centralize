import { ApolloClient, InMemoryCache, HttpLink, split, } from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { store } from "../redux/store";

const httpLink = new HttpLink({
  uri:import.meta.env.VITE_GRAPHQL_HTTP,
  credentials: 'include',
});

const wsLink = new GraphQLWsLink(createClient({
  url:import.meta.env.VITE_GRAPHQL_WS,
  connectionParams: () => {
    const token = store.getState().auth.myToken;
    return {
      authorization: token ? `Bearer ${token}` : '',
    };
  },
}));

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === 'OperationDefinition' &&
      def.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  credentials: 'include'
});

export default client;

