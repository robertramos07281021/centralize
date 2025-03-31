import { gql } from "graphql-tag";

const customerTypeDefs = gql`

  input CustomerData {
    address: String
    admin_fee_os: Float
    bill_due_day: Float 
    birthday: String
    endorsement_date: String
    grass_date: String
    bucket: String
    case_id: String
    one: String
    platform_user_id: String 
    credit_user_id: String
    customer_name: String
    dpd_grp: String
    dst_fee_os: Float
    email: String
    gender: String
    grass_region: String 
    interest_os: Float
    late_charge_os: Float
    max_dpd: Float
    penalty_interest_os: Float 
    principal_os: Float
    scenario: String
    tagging: String
    total_os: Float
    txn_fee_os: Float
    vendor_endorsement: String
  }

  type Success {
    success: Boolean!
    message: String!
  }
  
  # type Query {

  # }

  type Mutation {
    createCustomer(input:[CustomerData]): Success
  }
`

export default customerTypeDefs