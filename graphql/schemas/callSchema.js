import { gql } from "graphql-tag";

const callTypeDefs = gql`

  type Query {
    randomCustomer:Search
  }  

  type Mutation {
    makeCall(phoneNumber: String!): String
  }
  
`

export default callTypeDefs