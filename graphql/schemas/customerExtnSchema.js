import gql from "graphql-tag";


const CustomerExtnTypeDefs = gql`
  scalar DateTime

  type DispoType {
    name: String
    code: String
    _id: ID
  }

  type User {
    _id: ID
    name: String
    user_id: String
  }

  type AccountHistory {
    _id: ID
    account_bucket: Bucket
    account_callfile: Callfile
    case_id: String
    endorsement_date: String
    max_dpd: Int
    dpd: Int
    paid_amount: Float
    balance: Float
    out_standing_details: outStandingDetails
    cd: CurrentDispo
    dispotype: DispoType
  }

  type Query {
    findAccountHistories(id:ID!):[AccountHistory]
  }
`

export default CustomerExtnTypeDefs