import { gql } from "graphql-tag";

const taskTypeDefs = gql`

  type GroupTask {
    _id:ID
    task:[Search]
  }

  type EmergencyContact { 
    name: String
    mobile: String
  }

  type Query {
    myTasks:[Search]
    groupTask:GroupTask
  }
  type Mutation{
    selectTask(id:ID!):Success
    deselectTask(id:ID!):Success
    tlEscalation(id:ID!,tlUserId:ID!):Success
    updateDatabase:Success
    # updateCustomerAccount(id:ID):Success
  }
`

export default taskTypeDefs