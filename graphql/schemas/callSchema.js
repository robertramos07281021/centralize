import { gql } from "graphql-tag";

const callTypeDefs = gql`
  type Mutation {
    makeCall(phoneNumber: String!): String
  }
`

export default callTypeDefs