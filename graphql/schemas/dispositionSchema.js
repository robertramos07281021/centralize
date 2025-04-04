import { gql } from "graphql-tag";

const dispositionTypeDefs = gql`
  scalar DateTime
  type User {
    user_id: String
  }

  type Disposition {
    _id:ID
    amount: Float
    disposition: String
    payment_date: String
    ref_no: String
    existing: Boolean
    comment: String
    payment: String
    payment_method: String
    createdAt: DateTime
    created_by: User
  }
  
  type Success {
    success: Boolean!
    message: String!
  }
  
  type Query {
    getAccountDispositions(id:ID!, limit:Int):[Disposition]
  }

  type Mutation {
    createDisposition(customerAccountId:ID!,userId:ID!,amount:String, payment:String, disposition: String!, payment_date:String, payment_method:String, ref_no:String, comment:String): Success
  }
`

export default dispositionTypeDefs

