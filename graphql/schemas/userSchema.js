import { gql } from "graphql-tag";
const userTypeDefs = gql`
  scalar DateTime

  type Success {
    success: Boolean!
    message: String!
    user: Users
  }

  type Users {
    _id: ID
    name: String
    username: String
    type: String
    department: String
    branch: String
    change_password: Boolean
    bucket: String
    isOnline: Boolean
    active: Boolean
    createdAt: DateTime
    user_id: String
  }

  type PaginatedUsers {
    users: [Users]
    total: Int
  }

  type DeptUser {
    _id: ID
    name: String
    user_id: String,
    group: ID 
  }

  type Query {
    getUsers(page: Int!): PaginatedUsers!
    getUser(id: ID): Users
    getMe: Users
    getAomUser: [Users]
    findUsers(search: String!, page: Int!): PaginatedUsers!
    findDeptAgents:[DeptUser]
    findAgents:[Users]
  }

  type Mutation {
    createUser(name: String!, username: String!,type: String!, department: String!, branch: String!, id_number: String,bucket:String ): Success
    updatePassword(password:String!, confirmPass:String!) : Users
    resetPassword(id:ID!): Success
    updateUser(name:String!, type:String!, department:String!, branch:String!, bucket:String, id:ID!): Success
    login(username:String!, password:String!) : Success
    logout: Success
    logoutToPersist(id:ID!):Success
    updateActiveStatus(id:ID!): Success
  }
`;

export default userTypeDefs;
