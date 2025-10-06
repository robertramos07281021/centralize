import { gql } from "graphql-tag";

const bucketTypeDefs = gql`


  type Bucket {
    _id:ID
    name: String
    dept: String
    viciIp: String
    issabelIp: String
    principal: Boolean
    message: String
    can_update_ca: Boolean
    isActive: Boolean
  }
  
  type GetBuckets {
    dept: String
    buckets: [Bucket]
  }

  type AomDept {
    dept: String,
    buckets: [Bucket]
  }

  input UpdateBucket {
    id: ID
    name: String
    viciIp: String
    issabelIp: String
  }

  type Query {
    getBuckets(dept:[ID]):[GetBuckets]
    getBucket(name:String): Bucket
    getDeptBucket:[Bucket]
    getAllBucket:[Bucket]
    findDeptBucket(dept:ID):[Bucket]
    findAomBucket:[AomDept]
    getTLBucket:[Bucket]
    selectedBucket(id:ID):Bucket
  } 

  type Mutation {
    createBucket(name:String!, dept: String!, viciIp: String, issabelIp: String): Success
    updateBucket(input:UpdateBucket): Success
    deleteBucket(id:ID!): Success
    messageBucket(id:ID!,message:String):Success
  }
`

export default bucketTypeDefs