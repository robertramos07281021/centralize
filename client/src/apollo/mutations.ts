import { gql } from "@apollo/client";

// credentials mutations
export const LOGIN = gql `mutation login($username: String!, $password: String!) { login(username: $username, password: $password) { message success user { _id
  name
  username
  type
  department
  branch
  change_password
  buckets
  isOnline
  active
  createdAt
  user_id
  } } }`;

export const LOGOUT = gql `mutation logout { logout { message success } }`;

export const UPDATEPASSWORD = gql `mutation changePassword($password: String!, $confirmPassword:String!) {updatePassword(password: $password, confirmPass: $confirmPassword) {  branch username type name department id change_password }}`;


export const CREATE_ACCOUNT = gql`mutation createUser($username: String!, $name: String!, $type: String!, $branch: String!, $department: String!, $id_number:String!) {
  createUser(username: $username, name:$name, type: $type, branch: $branch, department: $department, id_number: $id_number) {
    id
    name
    username
    type
    department
    branch
    change_password
    bucket
    user_id
  }
}
`
export const UPDATE_USER = gql`mutation updateUser( $name:String!, $type: String!, $branch:String!, $department: String!, $bucket:String, $id: ID!) {
  updateUser( name:$name, type:$type, branch:$branch, department:$department, bucket:$bucket, id:$id){
    success
    message
    user {
      _id
      name
      username
      type
      department
      branch
      change_password
      buckets
      isOnline
      active
      createdAt
      user_id
    }
  }
}`

export const RESET_PASSWORD = gql`mutation resetPassword($id:ID!) {
  resetPassword(id:$id) {
    success
    message
  }
}

`

export const STATUS_UPDATE = gql`mutation Mutation($id:ID!) {
  updateActiveStatus(id:$id) {
    success
    message
    user {
      _id
      name
      username
      type
      department
      branch
      change_password
      buckets
      isOnline
      active
      createdAt
    }
  }
}`

//branch mutations ==================================================================================
export const CREATEBRANCH = gql`mutation createBranch($name: String!) {
  createBranch(name:$name) {
    success
    message
  }
}
`
export const UPDATEBRANCH = gql`mutation updateBranch($name: String!, $id: ID!) {
  updateBranch(name:$name, id: $id) {
    success
    message
  }
  }
`
export const DELETEBRANCH = gql`mutation deleteBranch($id: ID!) {
  deleteBranch(id:$id) {
    success
    message
  } 
}
`

//department mutations ===================================================================================
export const CREATEDEPT = gql`mutation
  createDept($name:String!, $branch:String!, $aom:String!) {
    createDept(branch:$branch, name:$name, aom:$aom) {
      success
      message
    }
  }
`
export const UPDATEDEPT = gql`mutation
  updateDept($name:String!, $branch:String!, $aom:String!, $id:ID!) {
    updateDept(branch:$branch, name:$name, aom:$aom, id:$id){
      success
      message
    }
  }
`
export const DELETEDEPT = gql `mutation
  deleteDept($id:ID!) {
    deleteDept(id:$id) {
      success
      message
    }
  }
`

// bucket mutations =====================================================================================
export const CREATEBUCKET = gql`mutation
  createBucket($name: String!, $dept:String!){
    createBucket(name:$name, dept:$dept) {
      success
      message
    }
  }
`
export const UPDATEBUCKET = gql `mutation
  updateBucket($name: String!,$id:ID!) {
    updateBucket(name: $name id:$id) {
      success
      message
    }
  }
`
export const DELETEBUCKET = gql `mutation
  deleteBucket($id:ID!) {
    deleteBucket(id:$id) {
      success
      message
    }
  }
`

// customer mutations ==================================================================================

export const CREATE_CUSTOMER = gql `mutation
  createCustomer($input:[CustomerData!]!) {
    createCustomer(input:$input) {
      success
      message
    }
  }
`

export const UPDATE_CUSTOMER = gql` mutation
  updateCustomer($fullName:String!, $dob:String!, $gender:String!, $mobiles:[String], $emails:[String], $addresses:[String],$id:ID!) {
    updateCustomer(fullName:$fullName, dob:$dob, gender:$gender, mobiles:$mobiles, emails:$emails, addresses:$addresses, id:$id) {
      success
      message
      customer {
        fullName
        dob
        gender
        contact_no
        emails
        addresses
        _id
      }
    }
  }
`

export const CREATE_DISPOSITION = gql`
  mutation CreateDisposition($customerAccountId: ID!, $userId: ID!, $disposition: String!, $amount: String, $payment: String, $payment_date: String, $payment_method: String, $ref_no: String, $comment: String) {
  createDisposition(customerAccountId: $customerAccountId, userId: $userId, disposition: $disposition, amount: $amount, payment: $payment, payment_date: $payment_date, payment_method: $payment_method, ref_no: $ref_no, comment: $comment) {
    success
    message
  }
}

`