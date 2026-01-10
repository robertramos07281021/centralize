import { gql } from "graphql-tag";

const callTypeDefs = gql`

  type Query {
    randomCustomer(buckets:[ID],autoDial:Boolean):Search
    checkUserIsOnlineOnVici(_id:ID!):Boolean
    checkIfAgentIsInline:String
    forRefetchingCustomer(_id:ID!):Search
    getUsersLogginOnVici(bucket:ID):String
    isAutoDial:Boolean
    checkIfCallfileAutoIsDone(callfile:ID):Boolean
    getBargingStatus(vici_id:String):String

  }  

  type Mutation {
    makeCall(phoneNumber: String!): String
    setCallfileToAutoDial(callfileId:ID!,roundCount:Int!,finished:Boolean!):Success
    endAndDispoCall:Success
    getCallRecording(user_id: ID!,mobile:String!):String
    bargeCall(session_id:String,viciUser_id: String):String
    updateDialNext(callfile:ID!):Success
    lateCallRecording(id: ID):[String]
  }
  
`

export default callTypeDefs