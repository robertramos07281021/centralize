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

  type CustomerInfo {
    fullName:String
    dob: String
    gender: String
    contact_no: [String]
    emails: [String]
    addresses: [String]
    _id:ID
  }

  type getCustomers {
    customers: [CustomerInfo]
    total: Int
  }

  type Success {
    success: Boolean!
    message: String!
    customer: CustomerInfo
  }
  
  type outStandingDetails {
    principal_os: Float
    interest_os: Float
    admin_fee_os: Float
    txn_fee_os: Float
    late_charge_os: Float
    dst_fee_os: Float
    total_os: Float
  }

  type grassDetails {
    grass_region: String
    vendor_endorsement: String
    grass_date: String
  }

  type  AccountBucket {
    name: String
    dept: String
  }

  # type AccountInfo {
  #   id: ID
  #   case_id: String,
  #   account_id: String
  #   endorsement_date: String
  #   credit_customer_id: String
  #   bill_due_day: Int
  #   max_dpd: Int
  #   balance: Int
  #   paid_amount: Int
  #   out_standing_details: outStandingDetails
  #   grass_details: grassDetails
  #   account_bucket: AccountBucket
  # } 

  type Search {
    _id: ID
    case_id: String
    account_id: String
    endorsement_date: String
    credit_customer_id: String
    bill_due_day: Int
    max_dpd: Int
    balance: Float
    paid_amount: Float
    out_standing_details: outStandingDetails
    grass_details: grassDetails
    account_bucket: AccountBucket
    customer_info: CustomerInfo
  }

  type Query {
    findCustomer(fullName:String, dob:String, email:String, contact_no:String): [CustomerInfo]
    getCustomers(page:Int): getCustomers!
    search(search:String):[Search]
  }

  type Mutation {
    createCustomer(input:[CustomerData]): Success
    updateCustomer(fullName:String!, dob:String!, gender:String!, mobiles:[String], emails:[String], addresses:[String],id:ID!): Success
  }
`

export default customerTypeDefs