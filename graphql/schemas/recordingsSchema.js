import { gql } from "graphql-tag";

const recordingTypeDefs = gql`
  type Query {
    findLagRecording(name: String,_id:ID):Int
  }

  type Mutation {
    findRecordings(name:String!,_id:ID!, ccsCall: Boolean):Success
    deleteRecordings(filename: String):Success
    recordingsFTP(_id:ID!, fileName:String!):Success
  }
`

export default recordingTypeDefs