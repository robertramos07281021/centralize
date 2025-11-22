import { gql } from "graphql-tag";

const userTypeDefs = gql`
  scalar DateTime

  type Success {
    user: Users
    url: String
    start: DateTime
    success: Boolean!
    message: String!
    dispoId: ID
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
    vici_id: String
    departmentDetails: Department
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
    user_id: String
    group: ID
    type: String
    isOnline: Boolean
    isLock: Boolean
    active: Boolean
    account_type: String
    callfile_id: String
    attempt_login: Int
    targets: Target
    buckets: [Bucket]
    departments: [Department]
    vici_id: String
  }

  type CampaignUser {
    campaign: ID
    assigned: Int
  }
  union FTE = Department | Bucket

  type AOM_FTE {
    department: Department
    users: [Users]
  }

  type Query {
    getUsers(page: Int!, limit: Int!): PaginatedUsers!
    getQAUsers(page: Int!, limit: Int!): PaginatedUsers!
    getUser(id: ID): Users
    getMe: Users
    getBucketUser(bucketId: ID): [Users]
    getAomUser: [Users]
    findUsers(search: String!, page: Int!, limit: Int!, filter: String!): PaginatedUsers!
    findDeptAgents: [DeptUser]
    findAgents: [Users]
    getCampaignAssigned(bucket:ID): Int
    getAOMCampaignFTE: [AOM_FTE]
    getHelperAgent: [Users]
    getBucketTL: [Users]
  }

  input CreatingAccount {
    name: String!
    username: String!
    type: String!
    departments: [ID]
    branch: ID
    user_id: String
    buckets: [ID]
    account_type: String
    callfile_id: String
    vici_id: String
  }

  input UpdateAccount {
    name: String!
    type: String!
    departments: [ID]
    branch: ID
    buckets: [ID]
    user_id: String
    callfile_id: String
    account_type: String
    id: ID!
    vici_id: String
  }

  input UpdateQAInput {
    userId: ID!
    departments: [ID]
    buckets: [ID]
  }

  type Mutation {
    createUser(createInput: CreatingAccount): Success
    updateUser(updateInput: UpdateAccount): Success
    updatePassword(password: String!, confirmPass: String!): Users
    resetPassword(id: ID!): Success
    login(username: String!, password: String!): Login
    logout: Success
    adminLogout(id: ID): Success
    logoutToPersist(id: ID!): Success
    updateActiveStatus(id: ID!): Success
    unlockUser(id: ID!): Success
    authorization(password: String!): Success
    deleteUser(id: ID!): Success
    updateUserVici_id(vici_id: String!): Success
    updateQAUser(input:UpdateQAInput): Success
  }
`;

export default userTypeDefs;
