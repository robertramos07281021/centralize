import { gql } from "graphql-tag";

const recordingTypeDefs = gql`

  type Success {
    success: Boolean
    message: String
  }

  type Mutation {
    findRecordings(id:ID):Success
  }
`

export default recordingTypeDefs