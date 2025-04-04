import { gql } from "graphql-tag";

const dispositionTypeDefs = gql`
  scalar DateTime
  type Disposition {
    id:ID
    amount: Float
    disposition: String
    payment_date: String
    ref_no: String
  }
  
  type Success {
    success: Boolean!
    message: String!
  }
  
  type Query {
    getAccountDispositions(id:ID!):[Disposition]

  }

  type Mutation {
    createDisposition(customerAccountId:ID!,userId:ID!,amount:String, payment:String, disposition: String!, payment_date:String, payment_method:String,ref_no:String, comment:String ): Success
  }
`

export default dispositionTypeDefs

