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

  type Success {
    success: Boolean!
    message: String!
  }

  type Query {
    getDepts: [Dept]
    getDept(name: String): Department
    getBranchDept(branch:String) : [Department]
    getAomDept: [Department]
  }

  type Mutation {
    createDept(name: String!, branch: String!, aom: String!): Success
    updateDept(id:ID!, name:String!, branch:String!, aom: String!): Success
    deleteDept(id:ID!): Success
  }
`;

export default deptTypeDefs;
