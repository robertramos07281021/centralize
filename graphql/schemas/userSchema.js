import { gql } from "graphql-tag";
const userTypeDefs = gql`
  scalar DateTime
  type User {
    id: ID
    name: String
    username: String
    type: String
    department: String
    branch: String
    change_password: Boolean
    buckets: [String]
  }

  type Success {
    success: Boolean!
    message: String
    user: User
  }

  type SuccessLogout {
    success: Boolean!
    message: String!
  }

  type Users {
    _id: ID
    name: String
    username: String
    type: String
    department: String
    branch: String
    change_password: Boolean
    buckets: [String]
    isOnline: Boolean
    active: Boolean
    createdAt: DateTime
    user_id: String
  }

  type PaginatedUsers {
    users: [Users]
    total: Int
  }

  type SuccessUpdate {
    success: Boolean!
    message: String!
    user: Users!
  }

  type DeptUser {
    _id: ID
    name: String
    user_id: String,
    group: ID 
  }

  type Query {
    getUsers(page: Int!): PaginatedUsers!
    getUser(id: ID): User
    getMe:User
    getAomUser: [User]
    findUsers(search: String!, page: Int!): PaginatedUsers!
    findDeptAgents:[DeptUser]
    findAgents:[Users]
  }

  type Mutation {
    createUser(name: String!, username: String!,type: String!, department: String!, branch: String!, id_number: String ): User

    updatePassword(password:String!, confirmPass:String!) : User

    resetPassword(id:ID!): SuccessLogout

    updateUser(name:String!, type:String!, department:String!, branch:String!, bucket:String, id:ID!): SuccessUpdate

    login(username:String!, password:String!) : SuccessUpdate

    logout: SuccessLogout

    updateActiveStatus(id:ID!): SuccessUpdate
  }
`;

export default userTypeDefs;
