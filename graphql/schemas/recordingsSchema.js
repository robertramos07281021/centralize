import { gql } from "graphql-tag";

const recordingTypeDefs = gql`
  type Query {
    findLagRecording(name: String,_id:ID):Int
  }

  type Mutation {
    findRecordings(name:String!,_id:ID!):Success
    deleteRecordings(filename: String):Success
  }
`

export default recordingTypeDefs