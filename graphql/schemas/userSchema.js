import { gql } from "graphql-tag";

const userTypeDefs = gql`
  scalar DateTime

  type Success {
    success: Boolean!
    message: String!
    user: Users
  }

  enum Break {
    LUNCH 
    COFFEE
    MEETING 
    TECHSUPP 
    CRBREAK 
    COACHING 
    HRMEETING
    HANDSETNEGO 
    SKIPTRACING
    CLINIC 
    PROD
    WELCOME 
  }

  type Login {
    user: Users
    prodStatus: Break
    start: String
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
    isLock: Boolean
    createdAt: DateTime
    user_id: String
    group: ID
    account_type: String
  }

  type PaginatedUsers {
    users: [Users]
    total: Int
  }

  type Bucket {
    _id: ID
    name: String
  }

  type Department {
    _id: ID
    name: String
  }

  type DeptUser {
    _id: ID
    name: String
    user_id: String,
    type: String
    group: ID 
    isLock: Boolean
    isOnline: Boolean
    attempt_login: Int
    buckets: [Bucket]
    default_target: Float
    departments: [Department] 
  }

  type CampaignUser {
    campaign: ID,
    assigned: Int
  }

  type Query {
    getUsers(page: Int!, limit: Int!): PaginatedUsers!
    getUser(id: ID): Users
    getMe: Users
    getAomUser: [Users]
    findUsers(search: String!, page: Int!, limit: Int!): PaginatedUsers!
    findDeptAgents:[DeptUser]
    findAgents:[Users],
    getCampaignAssigned: [CampaignUser]
  }
  type SubscriptionSuccess {
    buckets: [ID],
    message: String
  }

  type Subscription {
    ping: String!,
    somethingOnAgentAccount: SubscriptionSuccess
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
    login(username:String!, password:String!) : Login
    logout: Success
    logoutToPersist(id:ID!):Success
    updateActiveStatus(id:ID!): Success
    unlockUser(id:ID!): Success
    authorization(password:String!):Success 
  }
`;

export default userTypeDefs;
