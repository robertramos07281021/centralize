import { gql } from "graphql-tag";

const callfileTypeDefs = gql`
  scalar DateTime

  type Success {
    message: String
    success: Boolean
  }

  type User {
    name: String
  }

  type Callfile {
    _id: ID
    bucket: ID
    name: String
    createdAt: DateTime
    active: Boolean
    endo: String
    finished_by: User
    totalPrincipal: Float
    target: Float
  }

  type Result {
    callfile: Callfile
    uncontactable: Int
    accounts: Int
    connected: Int
    target: Float
    principal: Float
    collected: Float
    OB: Float
  }

  type CallFilesResult {
    result: [Result]
    count: Int
  }
  type MonthlyDetails {
    department: ID
    success: Int
    positive: Int
    rpc: Int
    unconnected: Int
  }


  type Query {
    getCallfiles(bucket:ID, limit:Int! , page:Int! ,status: String!):CallFilesResult
    downloadCallfiles(callfile:ID!): String!
    monthlyDetails: [MonthlyDetails]
    getBucketCallfile(bucketId:[ID]):[Callfile]
  }

  type Mutation {
    setCallfileTarget(callfile:ID!,target:Float!):Success
    finishedCallfile(callfile:ID!):Success
    deleteCallfile(callfile:ID!):Success
  }

`

export default callfileTypeDefs