import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://172.16.24.31:4000/graphql", // Replace with your GraphQL API
    credentials: 'include'
  }),
  cache: new InMemoryCache(),
});

export default client;
