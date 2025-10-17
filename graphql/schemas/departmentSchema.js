import { gql } from "graphql-tag";

const deptTypeDefs = gql`



  type Department {
    id: ID
    name: String
    branch: String
    aom: String
  }

  type Aom {
    _id: ID
    name: String
    username: String
    type: String
    department: String
    branch: String
    change_password: Boolean,
    bucket: String
  }

  type Dept {
    id: ID!
    name: String!
    branch: String!
    aom: Aom
  }

  type Query {
    getDepts: [Department]
    getDept(name: String): Department
    getBranchDept(branch:String) : [Department]
    getAomDept: [Department]
    getDepartmentBucket(depts:[ID]):[Bucket]
  }

  type Mutation {
    createDept(name: String!, branch: String!, aom: String!): Success
    updateDept(id:ID!, name:String!, branch:String!, aom: String!): Success
    deleteDept(id:ID!): Success
  }
`;

export default deptTypeDefs;
