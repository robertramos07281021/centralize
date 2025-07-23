import { gql } from "graphql-tag";

const dispositionTypeDefs = gql`
  scalar DateTime

  type DispoType {
    name: String!
    code: String!
    _id: ID!
  }

  type Disposition {
    _id:ID
    amount: Float
    ca_disposition: DispoType
    payment_date: String
    ref_no: String
    existing: Boolean
    comment: String
    payment: String
    payment_method: String
    createdAt: DateTime
    created_by: String
    contact_method: String
  }
  
  type Success {
    success: Boolean!
    message: String!
  }

  type Agent {
    _id: ID
    name: String
    branch: String
    department: String
    user_id: String
    buckets: [ID]
  }

  type DispoData {
    code: String
    name: String
    count: Int
  }

  type Reports {
    agent: Agent
    bucket: String
    disposition: [DispoData]
  }

  type AgentDisposition {
    agent: String
    user_id: String
    dispositions: [DispoData]
  }

  type Dispo {
    dispotype: ID,
    count: Int
  }

  type User {
    name: String
    user_id: String
  }
  
  type DispoReport {
    disposition: String
    users: [User]
    count: Int
  }

  type Buckets { 
    bucket: String
    totalAmount: Float
    dispositions: [DispoReport]
  }

 
  type BucketAomDashobard {
    campaign: ID
    ptp_amount: Float
    ptp_kept_amount:Float
    amount_collected_amount:Float
  }
  type Count {
    count: Int
  }

  type DailyFTE {
    campaign: ID
    online: Int
  }

  type AomDailyCollection {
    campaign: ID,
    calls: Float
    sms: Float
    email: Float
    field: Float
    skip: Float
    total: Float
  }

  enum ContactMethod {
    skip
    calls
    email
    sms
    field
  }
  type TLDashboardProd {
    bucket: ID
    calls: Float
    sms: Float
    email: Float
    field: Float
    skip: Float
  }

  type TLTotal {
    bucket: ID
    count: Int
    amount: Float
    yesterday: Float
  }

  type TLDailyCollected {
    bucket: ID
    amount: Float
    yesterday: Float
  }

  type AgentDispo {
    user: ID
    count: Int
    ptp: Float
    pk: Float
    ac: Float
    rpc: Int
    y_pk: Float
    y_ptp: Float
    y_ac: Float
  }

  type BucketTargets {
    bucket: ID
    collected: Float
    target: Float
  }

  input CreateDispo {
    customer_account:ID!
    disposition: ID!
    amount:String
    payment:String
    payment_date:String
    payment_method:String
    ref_no:String
    comment:String
    dialer: String
    chatApp: String
    contact_method: ContactMethod!
  }

  type Query {
    getAccountDispositions(id:ID!, limit:Int):[Disposition]
    getAccountDispoCount(id:ID!): Count
    getDispositionReports(agent:String, bucket:String, disposition:[String], from:String, to:String): Reports
    getAllDispositionTypes:[DispoType]
    getDailyFTE:[DailyFTE]
    getAOMPTPPerDay: [AomDailyCollection]
    getAOMPTPKeptPerDay: [AomDailyCollection]
    getAOMPaidPerDay: [AomDailyCollection]
    getTLPaidToday:[TLDashboardProd]
    getTLPTPKeptToday: [TLDashboardProd]
    getTLPTPToday: [TLDashboardProd]
    getTLPTPTotals: [TLTotal]
    getTLPTPKeptTotals: [TLTotal]
    getTLPaidTotals: [TLTotal],
    getTLDailyCollected: [TLDailyCollected]
    agentDispoDaily: [AgentDispo]
    getTargetPerCampaign: [BucketTargets]

  }

  type Mutation {
    createDisposition(input:CreateDispo): Success
  }
`

export default dispositionTypeDefs

