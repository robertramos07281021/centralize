import { gql } from "graphql-tag";

const recordingTypeDefs = gql`

  type Success {
    url: String
  }

  type Mutation {
    findRecordings(id:ID):Success
    deleteRecordings(filename: String):Success
  }
`

export default recordingTypeDefs