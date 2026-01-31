import { Targets } from "../redux/slices/authSlice.ts";

export type UserInfo = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean;
  departments: string[];
  callfile_id: string;
  buckets: string[];
  user_id: string;
  vici_id: string;
};

export type Department = {
  id: string;
  name: string;
  branch: string;
  aom: UserInfo | null;
};

export type Dept = {
  name: string;
  branch: string;
  aom: string;
  id: string;
};

export type Users = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION";
  branch: string;
  username: string;
  name: string;
  change_password: boolean;
  departments: string[];
  buckets: string[];
  callfile_id: string;
  isOnline: boolean;
  isLock: boolean;
  active: boolean;
  createdAt: string;
  account_type: string;
  user_id: string;
  targets: Targets;
  vici_id: string;
  softphone: string
};

// _id
// type
// branch
// username
// name
// change_password
// departments
// buckets
// callfile_id
// isOnline
// isLock
// active
// createdAt
// account_type
// user_id
// targets
// vici_id

export type CustomerData = {
  address: string;
  admin_fee_os: number;
  bill_due_date: string;
  birthday: string;
  endorsement_date: string;
  grass_date: string;
  bucket: string;
  case_id: string;
  one: string;
  platform_user_id: string;
  credit_user_id: string;
  customer_name: string;
  dpd_grp: string;
  dst_fee_os: number;
  email: string;
  gender: string;
  grass_region: string;
  interest_os: number;
  batch_no: string;
  late_charge_os: number;
  max_dpd: number;
  dpd: number;
  penalty_interest_os: number;
  principal_os: number;
  scenario: string;
  tagging: string;
  total_os: number;
  txn_fee_os: number;
  vendor_endorsement: string;
  term: number;
  paid: number;
  product: string;
  rem_months: number;
  code: string;
  mcc_date: string;
  mcc_endo?: string;
  cycle: number;
  lb: number;
  mad:number
};

// =======================
// customer update form, customer disposition
// =====================================
export type OutStandingDetails = {
  last_payment_date: number;
  last_payment_amount: number;
  model: number;
  brand: number;
  year: number;
  principal_os: number;
  interest_os: number;
  admin_fee_os: number;
  txn_fee_os: number;
  late_charge_os: number;
  dst_fee_os: number;
  total_os: number;
  waive_fee_os: number;
  late_charge_waive_fee_os: number;
  writeoff_balance: number;
  overall_balance: number;
  cf: number;
  mo_balance: number;
  pastdue_amount: number;
  mo_amort: number;
  partial_payment_w_service_fee: number;
  new_tad_with_sf: number;
  new_pay_off: number;
  service_fee: number;
  rem_months: number;
  paid: number;
  product: string;
  term: number;
  client_type: string;
  overdue_balance: number;
  client_id: string;
  loan_start: string;
  due_date: string;
  code: string;
  mcc_endo?: string;
  cycle: number;
  lb: number;
  mad:number;
  topup: number;
  employer_name: string;

};

type grassDetails = {
  grass_region: string;
  vendor_endorsement: string;
  grass_date: string;
};

export type AccountBucket = {
  name: string;
  dept: string;
  _id: string;
  can_update_ca: boolean;
  isPermanent: boolean
};

type EmergencyContact = {
  name: string;
  mobile: string;
};

export type CustomerRegistered = {
  fullName: string;
  dob: string;
  gender: string;
  contact_no: string[];
  emails: string[];
  addresses: string[];
  _id: string;
  isRPC: boolean;
};

export type CurrentDispo = {
  _id: string;
  amount: number;
  disposition: string;
  payment_date: string;
  ref_no: string;
  existing: boolean;
  comment: string;
  payment: String;
  payment_method: string;
  user: string;
  dialer: string;
  createdAt: string;
  contact_method: string;
  chatApp: string;
  sms: string;
  RFD: String;
  selectivesDispo: boolean;
};

export type AccountUpdateHistory = {
  principal_os: number;
  total_os: number;
  balance: number;
  updated_date: string;
  updated_by: string;
};

export type Search = {
  _id: string;
  case_id: string;
  account_id: string;
  endorsement_date: string;
  credit_customer_id: string;
  bill_due_date: string;
  max_dpd: number;
  dpd: number;
  balance: number;
  paid_amount: number;
  month_pd: number;
  assigned: string;
  assigned_date: string;
  batch_no: string;
  account_update_history: AccountUpdateHistory[];
  out_standing_details: OutStandingDetails;
  grass_details: grassDetails;
  account_bucket: AccountBucket;
  customer_info: CustomerRegistered;
  isRPCToday: boolean;
  emergency_contact: EmergencyContact;
  dispo_history: CurrentDispo[];
  current_disposition: CurrentDispo;
};


  //   type Search {
  //   _id: ID
  //   case_id: String
  //   account_id: String
  //   endorsement_date: String
  //   credit_customer_id: String
  //   bill_due_date: String
  //   max_dpd: Int
  //   balance: Float
  //   month_pd: Int
  //   dpd: Int
  //   assigned: ID
  //   assigned_date: String
  //   paid_amount: Float
  //   batch_no: String
  //   out_standing_details: outStandingDetails
  //   account_update_history: [AccountUpdateHistory]
  //   grass_details: grassDetails
  //   account_bucket: Bucket
  //   customer_info: CustomerInfo
  //   isRPCToday: Boolean
  //   emergency_contact: EmergencyContact
  //   dispo_history: [CurrentDispo]
  //   current_disposition: CurrentDispo
  // }


export enum IntervalsTypes {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CALLFILE = 'callfile',
}
