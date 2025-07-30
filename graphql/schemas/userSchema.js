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
    token: String
  }

  type Target {
    daily: Float
    weekly: Float
    monthly: Float
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
    callfile_id: String
    isLock: Boolean
    createdAt: DateTime
    user_id: String
    group: ID
    targets: Target
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
    branch: String
  }

  type DeptUser {
    _id: ID
    name: String
    user_id: String,
    group: ID 
    type: String
    isOnline: Boolean
    isLock: Boolean
    account_type: String
    attempt_login: Int
    callfile_id: String
    targets: Target
    buckets: [Bucket]
    departments: [Department] 
  }

  type CampaignUser {
    campaign: ID,
    assigned: Int
  }
  union FTE = Department | Bucket

  type AOM_FTE {
    department: Department 
    users: [Users]
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
    getAOMCampaignFTE: [AOM_FTE],
    getHelperAgent: [Users]
    getBucketTL:[Users]
  }

  input CreatingAccount {
    name: String!, 
    username: String!, 
    type: String!, 
    departments: [ID], 
    branch: ID, 
    user_id: String, 
    buckets:[ID] 
    account_type: String 
    callfile_id: String
  }
  input UpdateAccount {
    name:String!, 
    type:String!, 
    departments:[ID], 
    branch:ID, 
    buckets:[ID], 
    user_id: String,
    callfile_id: String,
    account_type: String
    id:ID!
  }

  type Mutation {
    createUser(createInput:CreatingAccount): Success

    updateUser(updateInput:UpdateAccount): Success

    updatePassword(password:String!, confirmPass:String!) : Users
    resetPassword(id:ID!): Success
    login(username:String!, password:String!) : Login
    logout: Success
    adminLogout(id: ID): Success
    logoutToPersist(id:ID!):Success
    updateActiveStatus(id:ID!): Success
    unlockUser(id:ID!): Success
    authorization(password:String!):Success 
    deleteUser(id:ID!):Success
  }
`;

export default userTypeDefs;
