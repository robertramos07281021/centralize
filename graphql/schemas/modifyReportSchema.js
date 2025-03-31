import { gql } from "graphql-tag";

const modifyReportTypeDefs = gql`
  scalar DateTime
  type ModifyReport {
    id:ID!
    name: String!
    user: ID!
    createdAt: DateTime
  }
  
  type Query {
    getModifyReport(id: ID!):[ModifyReport]
  }
`

export default modifyReportTypeDefs