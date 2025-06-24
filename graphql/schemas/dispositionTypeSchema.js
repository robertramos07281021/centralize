import { gql } from "graphql-tag";

const dispositionTypeTypeDefs = gql`
  type CA {
    skipper: Boolean
    caller: Boolean
    field: Boolean
  }

  type DispositionType {
    id:ID
    name: String
    code: String
    buckets: [ID]
    active: Boolean
    contact_methods: CA
  }

  type Success {
    success: Boolean
    message: String
  }
  
  enum Method {
    skipper
    field
    caller
  }

  input CreatingDispo {
    name: String!
    code: String!
    buckets: [ID]
    contact_method: [Method]
  }

  type Query {
    getDispositionTypes:[DispositionType]
  }

  type Mutation {
    createDispositionType(input:CreatingDispo):Success
    updateDispositionType(id:ID!,input:CreatingDispo): Success
  }
`

export default dispositionTypeTypeDefs