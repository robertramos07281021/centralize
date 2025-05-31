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
    departments: [ID]
    branch: ID
    change_password: Boolean
    buckets: [ID]
    isOnline: Boolean
    active: Boolean
    createdAt: DateTime
    user_id: String
    group: ID
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

  type CampaignUser {
    campaign: ID,
    assigned: Int
  }

  type Query {
    getUsers(page: Int!): PaginatedUsers!
    getUser(id: ID): Users
    getMe: Users
    getAomUser: [Users]
    findUsers(search: String!, page: Int!): PaginatedUsers!
    findDeptAgents:[DeptUser]
    findAgents:[Users],
    getCampaignAssigned: [CampaignUser]
  }

  type Subscription {
    ping: String!
  }

  type Mutation {

    createUser( 
      name: String!, 
      username: String!, 
      type: String!, 
      departments: [ID], 
      branch: ID, 
      user_id: String, 
      buckets:[ID] 
    ): Success

    updateUser(
      name:String!, 
      type:String!, 
      departments:[ID], 
      branch:ID, 
      buckets:[ID], 
      id:ID!
    ): Success

    updatePassword(password:String!, confirmPass:String!) : Users
    resetPassword(id:ID!): Success
    login(username:String!, password:String!) : Success
    logout: Success
    logoutToPersist(id:ID!):Success
    updateActiveStatus(id:ID!): Success
  }
`;

export default userTypeDefs;
