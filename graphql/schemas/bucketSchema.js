import { gql } from "graphql-tag";

const bucketTypeDefs = gql`


  type Bucket {
    id:ID
    name: String
    dept: String
  }
  
  type Success {
    success: Boolean!
    message: String!
  }
  
  type GetBuckets {
    dept: String
    buckets: [Bucket]
  }

  type AomDept {
    dept: String,
    buckets: [Bucket]
  }

  type Query {
    getBuckets(dept:[ID]):[GetBuckets]
    getBucket(name:String): Bucket
    getDeptBucket:[Bucket]
    getAllBucket:[Bucket]
    findDeptBucket(dept:ID):[Bucket]
    findAomBucket:[AomDept]
    
  }

  type Mutation {
    createBucket(name:String!, dept: String!): Success
    updateBucket(id:ID!, name:String!): Success
    deleteBucket(id:ID!): Success
  }
`

export default bucketTypeDefs