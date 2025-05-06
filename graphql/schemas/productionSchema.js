import { gql } from "graphql-tag";

const productionTypeDefs = gql`

  type User {
    _id: ID
    name: String
    user_id: String
  }

  type Disposition {
    _id:ID
    dispotype: String
    count: Int
    collection: Float
  }
  
  type Production {
    _id: ID
    user: User
    dispositions: [Disposition]
  }
  type PerDay {
    date: Int
    total: Float
  }
  type perMonth {
    month: Int
    total: Float
  }
  type AgentTotalDispo {
    dispotype: String
    count: Int
  }

  type Query {
    getProductions:Production
    getAgentProductionPerDay:[PerDay]
    getAgentProductionPerMonth:[perMonth]
    getAgentTotalDispositions:[AgentTotalDispo]
  }

  # type Mutation {
  #   updateProduction
  # }
`

export default productionTypeDefs