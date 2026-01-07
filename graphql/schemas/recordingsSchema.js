import { gql } from "graphql-tag";

const recordingTypeDefs = gql`
  type CantFind {
    name: String
    size: Int
  }

  type Query {
    findLagRecording(name: String,_id:ID):Int
    findLagOnFTP(name: String):Int
    cantFindOnFTP(name: String):[CantFind]
  }

  type Mutation {
    findRecordings(name:String!,_id:ID!, ccsCall: Boolean):Success
    deleteRecordings(filename: String):Success
    recordingsFTP(_id:ID!, fileName:String!):Success
  }
`

export default recordingTypeDefs