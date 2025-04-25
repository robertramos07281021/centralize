import { gql } from "graphql-tag";

const groupTypeDefs = gql`
 type User {
    _id: ID
    name: String
    user_id: String
  }

  type GroupTask {
    _id: ID
    name: String,
    description: String,
    members: [Users],
  }

  type Success {
    success: Boolean
    message: String
  }

  type Query {
    findGroup:[GroupTask]
  }

  type Mutation {
    createGroup(name: String!,description: String): Success
    updateGroup(id:ID!,name: String,description: String, members:[ID]): Success
    addGroupMember(id:ID,member:ID): Success
    deleteGroupMember(id:ID!, member:ID!): Success
    deleteGroup(id:ID!): Success
    addGroupTask(groupId:ID!,task:[ID] ):Success
    deleteGroupTask(caIds:[ID]):Success

  }
`

export default groupTypeDefs