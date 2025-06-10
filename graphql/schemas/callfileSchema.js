import { gql } from "graphql-tag";

const callfileTypeDefs = gql`
  scalar DateTime

  type Success {
    message: String
    success: Boolean
  }

  type Callfile {
    _id: ID
    name: String
    createdAt: DateTime
    active: Boolean
    endo: String
  }

  type Result {
    callfile: Callfile
    accounts: Int
    connected: Int
    target: Float
    collected: Float
  }

  type CallFilesResult {
    result: [Result]
    count: Int
  }
  
  type Query {
    getCallfiles(bucket:ID, limit:Int! , page:Int! ,status: String!):CallFilesResult
  }

  type Mutation {
    finishedCallfile(callfile:ID!):Success
    deleteCallfile(callfile:ID!):Success
  }

`

export default callfileTypeDefs