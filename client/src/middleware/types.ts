export type UserInfo = {
  id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean
  department: string
  bucket: string
  user_id:string
};

export type Department = {
  id: string;
  name: string;
  branch: string;
  aom: UserInfo | null;
}


export type DeptAomId = {
  id: string;
  name: string;
  branch: string;
  aom: string;
}

export type Branch = {
  id: string;
  name: string;
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
  department: string
  bucket: string
  isOnline: boolean
  active: boolean
  createdAt: string
  user_id: string
}

export type ModifyRecords = {
  id: string
  name: string
  createdAt: string
}


export type ExcelFile = {
  address: string
  admin_fee_os: number
  bill_due_day:number 
  birthday:string | number // this is date
  endorsement_date:string | number// this is date
  grass_date:string | number // this is date
  bucket:string
  case_id:string | number //need to string
  one: string // need to string // cp number
  platform_user_id:string | number //need to string
  platform_user_id_1:string | number//need to string
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
  total_os_1:number
  txn_fee_os:number
  vendor_endorsement:string
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

type CustomerRegistered = {
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
    out_standing_details: outStandingDetails
    grass_details: grassDetails
    account_bucket: AccountBucket
    customer_info: CustomerRegistered
}




// export type AllCustomers = {
//   customers:CustomerRegistered[]
//   total: number
// }


