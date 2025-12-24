import { gql } from "graphql-tag";

const customerTypeDefs = gql`
  scalar DateTime

  input CustomerData {
    address: [String]
    admin_fee_os: Float
    bill_due_date: String
    birthday: String
    endorsement_date: String
    grass_date: String
    case_id: String
    contact: [String]
    platform_user_id: String
    credit_user_id: String
    customer_name: String
    dpd_grp: String
    dst_fee_os: Float
    balance: Float
    email: [String]
    gender: String
    grass_region: String
    interest_os: Float
    late_charge_os: Float
    max_dpd: Float
    penalty_interest_os: Float
    late_charge_waive_fee_os: Float
    principal_os: Float
    total_os: Float
    txn_fee_os: Float
    collectorID: String
    emergencyContactName: String
    emergencyContactMobile: String
    dpd: Int
    mpd: Int
    batch_no: String
    vendor_endorsement: String
    writeoff_balance: Float
    overall_balance: Float
    cf: Float
    mo_balance: Float
    pastdue_amount: Float
    mo_amort: Float
    branch: String
    partial_payment_w_service_fee: Float
    new_tad_with_sf: Float
    new_pay_off: Float
    service_fee: Float
    year: String
    brand: String
    model: String
    last_payment_amount: Float
    last_payment_date: String
    paid: Float
    term: Float
    rem_months: Float
    product: String
  }

  type CustomerInfo {
    fullName: String
    dob: String
    gender: String
    contact_no: [String]
    emails: [String]
    addresses: [String]
    _id: ID
    isRPC: Boolean
  }

  type getCustomers {
    customers: [CustomerInfo]
    total: Int
  }

  type Success {
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
    waive_fee_os: Float
    late_charge_waive_fee_os: Float
    writeoff_balance: Float
    overall_balance: Float
    cf: Float
    mo_balance: Float
    pastdue_amount: Float
    mo_amort: Float
    partial_payment_w_service_fee: Float
    new_tad_with_sf: Float
    new_pay_off: Float
    service_fee: Float
    year: String
    brand: String
    model: String
    last_payment_amount: Float
    last_payment_date: String
    paid: Float
    term: Float
    rem_months: Float
    product: String
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
    _id: ID
    amount: Float
    disposition: ID
    payment_date: String
    ref_no: String
    existing: Boolean
    comment: String
    payment: String
    payment_method: String
    user: ID
    RFD: String
    dialer: String
    createdAt: DateTime
    contact_method: String
    sms: String
    chatApp: String
    selectivesDispo: Boolean
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
    bill_due_date: String
    max_dpd: Int
    balance: Float
    dpd: Int
    paid_amount: Float
    batch_no: String
    out_standing_details: outStandingDetails
    grass_details: grassDetails
    account_bucket: Bucket
    customer_info: CustomerInfo
    currentDisposition: CurrentDispo
    dispoType: DispoType
    assigned: Assigned
    disposition_user: User
  }

  type FindCustomerAccount {
    CustomerAccounts: [CustomerAccount]
    totalCountCustomerAccounts: [ID]
  }

  type EmergencyContact {
    name: String
    mobile: String
  }

  type Search {
    _id: ID
    case_id: String
    account_id: String
    endorsement_date: String
    credit_customer_id: String
    bill_due_date: String
    max_dpd: Int
    balance: Float
    month_pd: Int
    dpd: Int
    assigned: ID
    assigned_date: String
    paid_amount: Float
    batch_no: String
    out_standing_details: outStandingDetails
    account_update_history: [AccountUpdateHistory]
    grass_details: grassDetails
    account_bucket: Bucket
    customer_info: CustomerInfo
    isRPCToday: Boolean
    emergency_contact: EmergencyContact
    dispo_history: [CurrentDispo]
    current_disposition: CurrentDispo
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
    ptpCount: Int
    pkCount: Int
    pCount: Int
    ptp: Float
    pk: Float
    paid: Float
  }

  type AomReportsResult {
    campaign: ID
  }

  input AomReport {
    campaign: ID
    bucket: ID
    from: String
    to: String
  }

  input QueryCustomerAccount {
    disposition: [String]
    groupId: ID
    page: Int
    assigned: String
    limit: Int
    selectedBucket: ID
    dpd: Int
    searchName: String
  }

  type Query {
    findCustomer(
      fullName: String
      dob: String
      email: String
      contact_no: String
    ): [CustomerInfo]
    getCustomers(page: Int): getCustomers!
    search(search: String): [Search]
    findCustomerAccount(query: QueryCustomerAccount): FindCustomerAccount
    accountsCount: Int
    getMonthlyTarget: [MonthlyTarget]
    getMonthlyPerformance: [PerformanceStatistic]
    customerOtherAccounts(caId: ID): [Search]
    # getAomReports(input:AomReport):[]
  }

  type Mutation {
    createCustomer(input: [CustomerData], callfile: String, bucket: ID): Success
    updateCustomer(
      fullName: String!
      dob: String!
      gender: String!
      mobiles: [String]
      emails: [String]
      addresses: [String]
      id: ID!
      isRPC: Boolean
    ): Success
    updateRPC(id: ID!): Success
  }
`;

export default customerTypeDefs;
