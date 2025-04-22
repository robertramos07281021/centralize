import { gql } from "graphql-tag";

const groupTypeDefs = gql`
 type User {
    _id: ID
    name: String
    username: String
    type: String
    department: String
    branch: String
    user_id: String
  }

  type GroupTask {
    _id: ID
    name: String,
    description: String,
    members: [Users],
    department: String
  }

  type Success {
    success: Boolean
    message: String
  }
  
  type Query {
    findGroup:[GroupTask]
  }

  type Mutation {
    createGroup(name: String!,description: String!, members:[ID]):Success
    updateGroup(id:ID,name: String!,description: String!, members:[ID]):Success
    addGroupMember(id:ID,member:ID):Success
  }
`

export default groupTypeDefs