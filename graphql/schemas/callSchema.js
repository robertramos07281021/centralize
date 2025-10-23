import { gql } from "graphql-tag";

const callTypeDefs = gql`

  type Query {
    randomCustomer:Search
    checkUserIsOnlineOnVici:Boolean
    getCallfileAutoDialStatus:Boolean
  }  

  type Mutation {
    makeCall(phoneNumber: String!): String
    setCallfileToAutoDial(callfileId:ID!):Success
  }
  
`

export default callTypeDefs