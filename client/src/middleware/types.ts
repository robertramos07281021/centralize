export type UserInfo = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean
  departments: string[]
  buckets: string[]
  user_id:string
};

export type Department = {
  id: string;
  name: string;
  branch: string;
  aom: UserInfo | null;
}

export type Success = {
  success: boolean;
  message: string;
}

export type Dept = {
  name: string;
  branch: string;
  aom: string
}

export type Users = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION";
  branch: string;
  username: string;
  name: string;
  change_password: boolean
  departments: string[]
  buckets: string[]
  isOnline: boolean
  isLock: boolean
  active: boolean
  createdAt: string
  account_type: string
  user_id: string
}

export type ModifyRecords = {
  id: string
  name: string
  createdAt: string
}

export type CustomerData = {
  address: string
  admin_fee_os: number
  bill_due_day:number 
  birthday:string 
  endorsement_date:string 
  grass_date:string 
  bucket:string
  case_id:string 
  one:string 
  platform_user_id:string 
  credit_user_id:string
  customer_name:string 
  dpd_grp:string
  dst_fee_os:number
  email:string
  gender:string
  grass_region:string 
  interest_os:number
  late_charge_os:number
  max_dpd:number
  penalty_interest_os:number 
  principal_os:number
  scenario:string
  tagging:string 
  total_os:number
  txn_fee_os:number
  vendor_endorsement:string
}

// =======================
// customer update form, customer disposition
// =====================================
type outStandingDetails = {
  principal_os: number
  interest_os: number
  admin_fee_os: number
  txn_fee_os: number
  late_charge_os: number
  dst_fee_os: number
  total_os: number
}

type grassDetails = {
  grass_region: string
  vendor_endorsement: string
  grass_date: string
}

type  AccountBucket = {
  name: string
  dept: string
}

export type CustomerRegistered = {
  fullName:string
  dob:string
  gender:string
  contact_no:string[]
  emails:string[]
  addresses:string[]
  _id:string
}

export type Search = {
    _id: string
    case_id: string
    account_id: string
    endorsement_date: string
    credit_customer_id: string
    bill_due_day: number
    max_dpd: number
    balance: number
    paid_amount: number
    out_standing_details: outStandingDetails
    grass_details: grassDetails
    account_bucket: AccountBucket
    customer_info: CustomerRegistered
}
