import { gql } from "graphql-tag";

const customerTypeDefs = gql`

  input CustomerData {
  address: String
  address_2: String
  address_3: String
  admin_fee_os: Float
  bill_due_day: Float 
  birthday: String
  endorsement_date: String
  grass_date: String
  case_id: String      
  contact: String
  contact_2: String
  contact_3: String
  platform_user_id: String 
  credit_user_id: String    
  customer_name: String
   dpd_grp: String
  dst_fee_os: Float
  email: String
   email_2: String
   email_3: String
  gender: String
  grass_region: String 
  interest_os: Float
  late_charge_os: Float
  max_dpd: Float   
  penalty_interest_os: Float 
  principal_os: Float
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
    _id: ID
  }

  type DispoType {
    _id: ID
    name: String
    code: String
  }

  type User {
    _id: ID
    name: String
    user_id: String
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
  }

  type GroupMember {
    _id: ID
    name: String
    user_id: String
  }
  
  type Group {
    _id: ID
    name: String
    description: String
    members: [GroupMember]
  }

  type User {
    _id: ID
    name: String
    user_id: String
  }

  union Assigned = Group | User

  type CustomerAccount {
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
    currentDisposition:CurrentDispo 
    dispoType: DispoType
    assigned: Assigned
    disposition_user: User
  }

  type FindCustomerAccount {
    CustomerAccounts: [CustomerAccount],
    totalCountCustomerAccounts: Int
  }

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

  type PerformanceStatistic {
    campaign: ID
    totalAccounts: Int
    connectedAccounts: Int
    targetAmount: Float
    collectedAmount: Float
    ptpKeptAccount: Int
    paidAccount: Float
    attendanceRate: Float
  }
 
  type MonthlyTarget {
    campaign: ID
    collected: Float
    target: Float
  }
  type AomReportsResult {
    campaign: ID
  }

  input AomReport {
    campaign: ID
    bucket: ID
    from: String
    to:String
  }


  type Query {
    findCustomer(fullName:String, dob:String, email:String, contact_no:String): [CustomerInfo]
    getCustomers(page:Int): getCustomers!
    search(search:String):[Search]
    findCustomerAccount(disposition:[String],groupId:ID,page:Int, assigned:String, limit:Int,selectedBucket: ID):FindCustomerAccount
    selectAllCustomerAccount(disposition:[String],groupId:ID,assigned:String, selectedBucket:ID):[ID]
    accountsCount:Int
    getMonthlyTarget:[MonthlyTarget]
    getMonthlyPerformance:[PerformanceStatistic]
    # getAomReports(input:AomReport):[]
  }

  type Mutation {
    createCustomer(input:[CustomerData], callfile: String!, bucket: ID!): Success
    updateCustomer(fullName:String!, dob:String!, gender:String!, mobiles:[String], emails:[String], addresses:[String],id:ID!): Success
  }
`

export default customerTypeDefs