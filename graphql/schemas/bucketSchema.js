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
    canCall: Boolean
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
    _id: ID
    name: String
    viciIp: String
    issabelIp: String
    canCall: Boolean
    can_update_ca: Boolean
    principal: Boolean
  }

  input CreateBucket {
    name: String!
    dept: String!
    viciIp: String
    issabelIp: String
    canCall: Boolean
    can_update_ca: Boolean
    principal: Boolean
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
    createBucket(input: CreateBucket): Success
    updateBucket(input:UpdateBucket): Success
    deleteBucket(id:ID!): Success
    messageBucket(id:ID!,message:String):Success
  }
`

export default bucketTypeDefs