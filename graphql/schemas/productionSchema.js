import { gql } from "graphql-tag";

const productionTypeDefs = gql`
  scalar DateTime
  type Disposition {
    _id:ID
    count: Int
  }

  type PerDay {
    date: Int
    calls: Float
    sms: Float
    email: Float
    skip: Float
    field: Float
    ptp_kept: Float
    paid: Float
    ptp: Float
    total: Float
  }
  type perMonth {
    month: Int
    calls: Float
    sms: Float
    email: Float
    skip: Float
    field: Float
    ptp_kept: Float
    paid: Float
    ptp: Float
    total: Float
  }
  type AgentTotalDispo {
    dispotype: ID
    count: Int
  }

  type Success {
    success: Boolean
    message: String
    start: DateTime
  }

  type DailyCollection {
    ptp_amount: Float
    ptp_count: Int
    ptp_yesterday: Float
    ptp_kept_amount: Float
    ptp_kept_count: Int
    ptp_kept_yesterday: Float
    paid_amount: Float
    paid_count: Int
    paid_yesterday: Float
  }
  type Login {
    success: Boolean
    message: String
  }

  type Dispotype {
    _id: ID
    name: String
    code: String
  }

  type DipotypeCount {
    dispotype: Dispotype,
    count: Int
  }

  type ProductionReport {
    totalDisposition: Int
    dispotypes: [DipotypeCount]
  }
  
  type History {
    type: String
    existing: Boolean
    start: String
  }

  type AgentProduction {
    _id: ID
    user: ID
    prod_history: [History]
    createdAt: DateTime
    target_today: Float
  }
  
  type DispositionInfo {
    _id: ID
    customer_name: String
    payment: String
    amount: Float
    dispotype: String
    payment_date: String
    ref_no: String
    comment: String
    contact_no: [String]
    createdAt: DateTime
    dialer: String
  }

  type AgentDispo {
    dispositions: [DispositionInfo]
    dispocodes: [String]
    total: Int
  }


  type MyProduction {
    dtcCurrent: Float
    dtcPrevious: Float
    ytCurrent: Float
    ytPrevious: Float
  }

  input Targets {
    daily: String
    weekly: String
    monthly: String
  }

  type Collected {
    monthly: Float
    weekly: Float
  }


  type Query {
    getAgentProductionPerDay:[PerDay]
    getAgentProductionPerMonth:[perMonth]
    getAgentTotalDispositions:[AgentTotalDispo]
    getAgentDailyCollection: DailyCollection
    ProductionReport(dispositions:[ID],from:String,to:String):ProductionReport
    getAgentProductions:[AgentProduction]
    agentProduction:MyProduction
    getAgentDispositionRecords(agentID:ID, limit:Int, page:Int, from:String, to:String, search: String, dispotype: [String]):AgentDispo
    monthlyWeeklyCollected:Collected
  }

  type Mutation {
    setTargets(userId:ID, targets: Targets):Success
    updateProduction(type: String!):Success
    loginToProd(password: String):Login
    lockAgent:Success
    setBucketTargets(bucketId:ID ,targets: Targets):Success
  }
`

export default productionTypeDefs