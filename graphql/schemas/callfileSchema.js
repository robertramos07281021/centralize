import { gql } from "graphql-tag";

const callfileTypeDefs = gql`
  scalar DateTime

  type User {
    name: String
  }

  type Callfile {
    _id: ID
    bucket: ID
    name: String
    createdAt: DateTime
    active: Boolean
    approve: Boolean
    endo: String
    finished_by: User
    totalPrincipal: Float
    totalAccounts: Int
    target: Float
    autoDial: Boolean
    totalOB: Float
    roundCount: Int
  }

  type CustomerAccountField {
    _id: ID
    firstName: String
    lastName: String
    bucket: ID
    callfile: ID
    accountNumber: String
    customer: ID
    forfield: Boolean
    balance: Float
    customerName: String
    addresses: [String]
    fieldassigned: ID
    contact_no: [String]
    emails: [String]
    started: Boolean
    finished: Boolean
    assignee: String
    approve: Boolean
  }

  type Result {
    callfile: Callfile
    uncontactable: Int
    accounts: Int
    connected: Int

    target: Float
    principal: Float
    collected: Float
    OB: Float
  }

  type CallFilesResult {
    result: [Result]
    count: Int
  }
  type MonthlyDetails {
    department: ID
    success: Int
    positive: Int
    rpc: Int
    unconnected: Int
  }

  type ToolsProduction {
    contact_method: String
    rpc: Int
    ptp: Float
    ptcp: Float
    confirm: Float
    kept: Float
    paid: Float
  }

  type Collection {
    target: Float
    collected: Float
  }

  type CallfileDispositionSummary {
    code: String
    name: String
    count: Int
    amount: Float
  }

  type BucketTaskCount {
    bucket: ID
    total: Int
  }

  input Selective {
    account_no: String
    amount: Float
    date: String
  }

  type AdminCallfile {
    result: [Callfile]
    total: Int
  }

  type UpdateCustomerApprovePayload {
    message: String!
    success: Boolean!
    customer: CustomerAccount
  }

  type UpdateCallfileApprovePayload {
    message: String!
    success: Boolean!
    callfile: Callfile
  }

  type Query {
    getCallfiles(
      bucket: ID
      limit: Int!
      page: Int!
      status: String!
    ): CallFilesResult
    getCF(bucket: ID, limit: Int!, page: Int!): AdminCallfile
    downloadCallfiles(callfile: ID!): String!
    monthlyDetails: [MonthlyDetails]
    getBucketCallfile(bucketId: [ID]): [Callfile]
    getBucketActiveCallfile(bucketIds: [ID]): [Callfile]
    getToolsProduction(bucket: ID, interval: String): [ToolsProduction]
    getCollectionMonitoring(bucket: ID, interval: String): Collection
    getCallfileDispositions(
      callfileId: ID!
      dateFrom: DateTime
      dateTo: DateTime
    ): [CallfileDispositionSummary]
    getAgentCallfileDispositions(
      agentId: ID!
      bucketId: ID
      callfileId: ID
      dateFrom: DateTime
      dateTo: DateTime
    ): [CallfileDispositionSummary]
    getCustomerAccountsByBucket(bucketId: ID!): [CustomerAccountField]
    getCustomerAccountsByAssignee(assigneeId: ID!): [CustomerAccountField]
    getFieldTasksByBuckets(bucketIds: [ID!]!): [BucketTaskCount]
  }

  type Mutation {
    setCallfileTarget(callfile: ID!, target: Float!): Success
    finishedCallfile(callfile: ID!): Success
    deleteCallfile(callfile: ID!): Success
    addSelective(
      _id: ID
      selectiveName: String
      selectives: [Selective]
    ): Success
    updateCallfileApprove(id: ID!, approve: Boolean!): UpdateCallfileApprovePayload
  }
`;

export default callfileTypeDefs;
