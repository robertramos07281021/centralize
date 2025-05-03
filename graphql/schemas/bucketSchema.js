import { gql } from "graphql-tag";

const bucketTypeDefs = gql`
  type Bucket {
    id:ID!
    name: String!
    dept: String!
  }
  
  type Success {
    success: Boolean!
    message: String!
  }
  
  type Query {
    getBuckets(dept:String):[Bucket]
    getBucket(name:String): Bucket
    getDeptBucket:[Bucket]
  }

  type Mutation {
    createBucket(name:String!, dept: String!): Success
    updateBucket(id:ID!, name:String!): Success
    deleteBucket(id:ID!): Success
  }
`

export default bucketTypeDefs