
import {gql} from "@apollo/client"


// cookie query
export const myUserInfos = gql` 
  query GetMe { 
    getMe {
      id
      name
      username
      type
      department
      branch
      change_password
    }
  } 
`

// users query ================================================
export const USER_QUERY = gql`
  query userQuery($id:ID) {
    getAomUser {
      id
      name
      username
      type
      department
      branch
      change_password
    }

    getUser(id: $id) {
      id
      name
      username
      type
      department
      branch
      change_password
    }
  }
`

export const FIND_QUERY = gql` 
  query Query($search: String!, $page: Int!) {
    findUsers(search: $search, page:$page ) {
      total
      users {
        _id
        name
        username
        type
        department
        branch
        change_password
        active
        isOnline
        bucket
        createdAt
      }
    }
  }
`

export const GET_ALL_USERS = gql`
  query Query($page: Int!) {
    getUsers(page:$page) {
      total
      users {
        _id
        name
        username
        type
        department
        branch
        change_password
        active
        isOnline
        bucket
        createdAt
      }
    }
  }
`
// ===========================================================
// branch query
export const BRANCH_QUERY = gql`
  query branchQuery($name:String) {
    getBranches {
      id
      name
    }
    getBranch(name: $name) {
      id
      name
    }
  } 
`

//department query ================================================================================
export const DEPARTMENT_QUERY = gql`
  query departmentQuery($name: String){
    getDepts {
      id
      name
      branch
      aom { id name username type department branch change_password }
    }

    getDept(name: $name) {
      id
      name
      branch
      aom 
    }

  }
`

export const BRANCH_DEPARTMENT_QUERY = gql`
  query Query($branch: String) {
    getBranchDept(branch: $branch){
      id
      name
      branch
      aom
    }
  }
`
export const DEPT_BUCKET_QUERY = gql`
  query Query($dept: String) {
    getDeptBucket(dept: $dept) {
      id
      name
      dept
    }
  }
`


//bucket query ==============================================================================================
export const BUCKET_QUERY = gql`
  query bucketQuery($dept:String, $name:String) {
    getBuckets(dept:$dept) {
      id
      name
      dept
    }
    getBucket(name:$name) {
      id
      name
      dept
    }
    
  }
`
//modify record query ============================================================================================
export const MODIFY_RECORD_QUERY = gql`
  query Query($id: ID!) {
    getModifyReport(id: $id) {
      id
      name
      createdAt
    }
  }
`


//customer query ===========================================================================================
export const ALL_CUSTOMER = gql`
query Query($page: Int) {
  getCustomers(page: $page) {
    customers {
      fullName
      dob
      gender
      contact_no
      emails
      addresses
      _id
    }
    total
  }
}
`


//customer account info
export const ACCOUNT_INFO = gql`
query AccountInfo($id: ID) {
  accountInfo(id: $id) {
    account_bucket {
      name
      dept
    }
    account_id
    bill_due_day
    case_id
    credit_customer_id
    endorsement_date
    grass_details {
      grass_region
      vendor_endorsement
      grass_date
    }
    id
    max_dp
    out_standing_details {
      principal_os
      interest_os
      admin_fee_os
      txn_fee_os
      late_charge_os
      dst_fee_os
      total_os
    }
  }
}
`
