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
    user: User
  }

  type Query {
    findAccountHistories(id:ID!):[AccountHistory]
  }

  type AccountUpdateHistory {
    principal_os: Float,
    total_os: Float,
    balance: Float,
    updated_date: DateTime,
    updated_by: ID
  }
  
  type UpdatedCustomerAccount {
    balance: Float,
    out_standing_details: outStandingDetails
    account_update_history: [AccountUpdateHistory]
  }

  type Success {
    customerAccount: UpdatedCustomerAccount
  }

  input CustomerAccountsInput {
    id:ID!
    total_os: Float
    principal_os: Float
    balance: Float
  }

  type Mutation {
    updateCustomerAccount(input:CustomerAccountsInput):Success
  }
`

export default CustomerExtnTypeDefs