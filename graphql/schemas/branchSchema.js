import { gql } from "graphql-tag";

const branchTypeDefs = gql`
  type Branch {
    id:ID!
    name: String!
  }
  
  type Success {
    success: Boolean
    message: String
  }
    
  type Query {
    getBranches:[Branch]
    getBranch(name:String):Branch 
  }

  type Mutation {
    createBranch(name:String!): Success
    updateBranch(id:ID!, name:String!): Success
    deleteBranch(id:ID!): Success
  }
`

export default branchTypeDefs