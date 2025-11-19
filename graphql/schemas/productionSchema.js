import { gql } from "graphql-tag";

const productionTypeDefs = gql`
  scalar DateTime
  type Disposition {
    _id: ID
    count: Int
  }

  type PerDay {
    date: Int
    ptp_kept: Float
    ptp: Float
    total: Float
  }
  type perMonth {
    month: Int

    ptp_kept: Float
    ptp: Float
    total: Float
  }
  type AgentTotalDispo {
    dispotype: ID
    count: Int
  }

  type DailyCollection {
    ptp_amount: Float
    ptp_count: Int
    ptp_kept_amount: Float
    ptp_kept_count: Int
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
    dispotype: Dispotype
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
    end: String
  }

  type AgentProduction {
    _id: ID
    user: ID
    prod_history: [History]
    createdAt: DateTime
    target_today: Float
  }

  type Recording {
    name: String
    size: Float
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
    callId: String
    recordings: [Recording]
    selectivesDispo: Boolean
  }

  type AgentDispo {
    dispositions: [DispositionInfo]
    dispocodes: [String]
    total: Int
  }

  type MyProduction {
    totalAmountPTP: Float
    totalCountPTP: Int
    totalAmountKept: Float
    totalCountKept: Float
  }

  input Targets {
    daily: String
    weekly: String
    monthly: String
  }

  type Collected {
    monthly: Float
    weekly: Float
    monthlyCount: Int
    weeklyCount: Int
  }

  type AgentRPCCount {
    dailyCount: Int
    totalCount: Int
  }

  type ProdHistory {
    type: String
    start: String
    end: String
    existing: Boolean
  }

  type Production {
    _id: ID!
    user: ID!
    target_today: Int
    prod_history: [ProdHistory]
    createdAt: DateTime
    total: Int
    average: Int
    longes: Int
  }



  extend type Query {
    productions: [Production]
    productionByUser(userId: ID!): Production
  }

  type Query {
    getAgentProductionPerDay: [PerDay]
    getAgentProductionPerMonth: [perMonth]
    getAgentTotalDispositions: [AgentTotalDispo]
    getAgentDailyCollection: DailyCollection
    getAgentRPCCount: AgentRPCCount
    ProductionReport(
      dispositions: [ID]
      from: String
      to: String
    ): ProductionReport
    getAgentProductions: [AgentProduction]
    agentProduction: MyProduction
    getAgentDispositionRecords(
      agentID: ID
      limit: Int
      page: Int
      from: String
      to: String
      search: String
      dispotype: [String]
      ccsCalls: Boolean!
    ): AgentDispo
    monthlyWeeklyCollected: Collected
    getAllAgentProductions(bucketId: ID, from: String, to: String): [Production]
  }

  type Mutation {
    setTargets(userId: ID, targets: Targets): Success
    updateProduction(type: String!): Success
    loginToProd(password: String): Login
    lockAgent: Success
    setBucketTargets(bucketId: ID, targets: Targets): Success
  }
`;

export default productionTypeDefs;
