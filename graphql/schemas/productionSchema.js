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
    ptp_yesterday: Float
    ptp_kept_amount: Float
    ptp_kept_yesterday: Float
    paid_amount: Float
    paid_yesterday: Float
  }
  type Login {
    success: Boolean
    message: String
  }


  type Query {
    getProductions:[Disposition]
    getAgentProductionPerDay:[PerDay]
    getAgentProductionPerMonth:[perMonth]
    getAgentTotalDispositions:[AgentTotalDispo]
    getAgentDailyCollection: DailyCollection
    getProductionStatus: String
  }


  type Mutation {
    updateProduction(type: String!):Success
    loginToProd(password: String):Login
  }
`

export default productionTypeDefs