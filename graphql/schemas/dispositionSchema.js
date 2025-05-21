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

  type BucketDisposition {
    bucket: String
    amount: Float
    users: [Agent]
    dispositions: [DispoData]
  } 

  type PerDayAmount {
    day: String,
    amount: Float
  }

  type PerDay {
    buckets: [PerDayAmount]
    bucket: ID
  }

  type DispositionPerDay {
    month: String,
    dispositionsCount: [PerDay]
  }

  
  type MonthAmount {
    month: String,
    amount: Float
  }

  type PerMonth {
    buckets: [MonthAmount]
    bucket: ID
  }

  type DispositionPerYear {
    year: String,
    dispositionsCount: [PerMonth]
  }

  type Dispo {
    dispotype: ID,
    count: Int
  }

  type DispositionCount {
    bucket: ID
    dispositions: [Dispo]
  }


  type SubsribeSuccess {
    message: String
    members: [ID]
  }

  type Subscription {
    dispositionUpdated: SubsribeSuccess
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

  type HighDispositionReport {
    dept: String
    buckets: [Buckets]
  }
  
  type YesterdayDispo {
    bucket: String
    count:Float
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

  type AomCampaignToday {
    campaign: ID
    ptp: Float
    ptp_kept: Float
    paid: Float
    yesterday_ptp: Float
    yesterday_ptp_kept: Float
    yesterday_paid: Float
  }

  type DailyFTE {
    campaign: ID
    online: Int
  }

  type PerMonthCollection {
    campaign: ID,
    amount: Float
  }


  type Query {
    getAccountDispositions(id:ID!, limit:Int):[Disposition]
    getAccountDispoCount(id:ID!): Count
    getDispositionReports(agent:String, bucket:String, disposition:[String], from:String, to:String): Reports
    getAgentDispositions:[AgentDisposition]
    getBucketDisposition:[BucketDisposition]
    getDispositionPerDay:DispositionPerDay
    getDispositionPerMonth:DispositionPerYear
    getDeptDispositionCount:[DispositionCount]
    getAllDispositionTypes:[DispoType]
    getDispositionReportsHigh(campaign:String, bucket:String, dispositions:[String], from:String, to:String):[HighDispositionReport]
    getDispositionCountYesterday:[YesterdayDispo]
    getAomDailyCollection:[AomCampaignToday]
    getDailyFTE:[DailyFTE]
    getPTPPerMonth: [PerMonthCollection]
    getPTPKeptPerMonth: [PerMonthCollection]
    getPaidPerMonth: [PerMonthCollection],

  }

  type Mutation {
    createDisposition(customerAccountId:ID!,amount:String, payment:String, disposition: String!, payment_date:String, payment_method:String, ref_no:String, comment:String): Success
  }
`

export default dispositionTypeDefs

