import { gql } from "graphql-tag";

const taskTypeDefs = gql`
  type CustomerInfo {
    _id:ID
    fullName:String
    dob: String
    gender: String
    contact_no: [String]
    emails: [String]
    addresses: [String]
  }

  type CurrentDispo {
    _id:ID
    amount: Float
    disposition: ID
    payment_date: String
    ref_no: String
    existing: Boolean
    comment: String
    payment: String
    payment_method: String
    user: ID
    dialer: String
    createdAt: DateTime
    contact_method: String
  }

  type Success {
    success: Boolean
    message: String
  }

  type current {
    disposition: String
  }

  type outStandingDetails {
    principal_os: Float
    interest_os: Float
    admin_fee_os: Float
    txn_fee_os: Float
    late_charge_os: Float
    dst_fee_os: Float
    total_os: Float
    waive_fee_os: Float
  }

  type grassDetails {
    grass_region: String
    vendor_endorsement: String
    grass_date: String
  }

  type AccountBucket {
    name: String
    dept: String
    _id: ID
  }

  type GroupTask {
    _id:ID
    task:[MyTasks]

  }

  type MyTasks {
    _id: ID
    case_id: String
    account_id: String
    endorsement_date: String
    credit_customer_id: String
    bill_due_day: Int
    max_dpd: Int
    balance: Float
    paid_amount: Float
    month_pd: Int
    assigned_date: String
    out_standing_details: outStandingDetails
    grass_details: grassDetails
    current_disposition: CurrentDispo
    account_bucket: AccountBucket
    customer_info: CustomerInfo
    dispo_history: [CurrentDispo]
  }

  type Query {
    myTasks:[MyTasks]
    groupTask:GroupTask
  }
  type Mutation{
    selectTask(id:ID!):Success
    deselectTask(id:ID!):Success
    tlEscalation(id:ID!,tlUserId:ID!):Success
    updateDatabase:Success
  }
`

export default taskTypeDefs