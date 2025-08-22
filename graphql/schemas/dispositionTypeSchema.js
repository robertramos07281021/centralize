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
    rank: Int
    status: Int
    active: Boolean
    contact_methods: CA
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
    rank: Int
    status: Int
    contact_method: [Method]
  }

  type Query {
    getDispositionTypes:[DispositionType]
    getDispositionTypesAll:[DispositionType]
  }

  type Mutation {
    createDispositionType(input:CreatingDispo):Success
    updateDispositionType(id:ID!,input:CreatingDispo): Success
    activateDeactivateDispotype(id:ID!) : Success
  }
`

export default dispositionTypeTypeDefs