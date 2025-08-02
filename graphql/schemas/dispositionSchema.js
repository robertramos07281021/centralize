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
    sms: String
    dialer: String
    chatApp: String
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
    _id: String
    code: String
    name: String
    count: Int
    amount: Float
  }
  

  type Callfile {
    _id: ID
    name: String
    totalPrincipal:Float
    totalAccounts: Int
    totalOB: Float
  }

  type RFD {
    _id: String
    count: Int
  }

  type Tools {
    dispositions: [DispoData]
    call_method: String
  }

  type Reports {
    agent: Agent
    bucket: String
    toolsDispoCount: [Tools]
    callfile: Callfile
    RFD: [RFD]
  }

  type AgentDisposition {
    agent: String
    user_id: String
    dispositions: [DispoData]
  }

  type Dispo {
    dispotype: ID
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
    contact_method: ContactMethod!
    amount:String
    payment:String
    payment_date:String
    payment_method:String
    ref_no:String
    comment:String
    dialer: String
    chatApp: String
    RFD: String
    sms: String
  }
  
  input SearchDispoReports {
    agent:String, 
    disposition:[String], 
    from:String, 
    to:String,
    callfile: ID!,
  }


  type Query {
    getAccountDispositions(id:ID!, limit:Int):[Disposition]
    getAccountDispoCount(id:ID!): Count
    getDispositionReports(reports:SearchDispoReports): Reports
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

