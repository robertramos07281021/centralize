import { gql } from "graphql-tag";

const dispositionTypeTypeDefs = gql`
  type DispositionType {
    id:ID!
    name: String!
    code: String!
  }

  type Success {
    success: Boolean
    message: String
  }
  
  type Query {
    getDispositionTypes:[DispositionType]
  }

  type Mutation {
    createDispositionType(name: String!,code: String!):Success
  }
`

export default dispositionTypeTypeDefs