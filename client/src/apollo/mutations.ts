import { gql } from "@apollo/client";

// credentials mutations
export const LOGIN = gql `mutation login($username: String!, $password: String!) { login(username: $username, password: $password) { message success user { _id
  name
  username
  type
  department
  branch
  change_password
  bucket
  isOnline
  active
  createdAt
  } } }`;

export const LOGOUT = gql `mutation logout { logout { message success } }`;

export const UPDATEPASSWORD = gql `mutation changePassword($password: String!, $confirmPassword:String!) {updatePassword(password: $password, confirmPass: $confirmPassword) {  branch username type name department id change_password }}`;


export const CREATE_ACCOUNT = gql`mutation createUser($username: String!, $name: String!, $type: String!, $branch: String!, $department: String!) {
  createUser(username: $username, name:$name, type: $type, branch: $branch, department: $department) {
    id
    name
    username
    type
    department
    branch
    change_password
    bucket
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
      bucket
      isOnline
      active
      createdAt
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
      bucket
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