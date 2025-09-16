import { gql } from "graphql-tag";

const recordingTypeDefs = gql`

  type Success {
    url: String
  }

  type Mutation {
    findRecordings(name:String!,_id:ID!):Success
    deleteRecordings(filename: String):Success
  }
`

export default recordingTypeDefs