import { ApolloClient, InMemoryCache, HttpLink, split, } from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

const httpLink = new HttpLink({
  uri: 'http://172.16.24.31:3000/graphql',
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://172.16.24.31:3000/graphql',
  connectionParams: () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  }
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

