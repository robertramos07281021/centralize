import { gql } from "graphql-tag";

const dispositionTypeDefs = gql`
  scalar DateTime

  type DispoType {
    name: String!
    code: String!
    _id: ID!
  }

  type Disposition {
    _id:ID
    amount: Float
    ca_disposition: DispoType
    payment_date: String
    ref_no: String
    existing: Boolean
    comment: String
    payment: String
    payment_method: String
    createdAt: DateTime
    created_by: String
  }
  
  type Success {
    success: Boolean!
    message: String!
  }

  type Agent {
    id: String
    name: String
    branch: String
    department: String
    user_id: String
    buckets: [String]
  }

  type DispoData {
    code: String
    name: String
    count: Int
  }

  type Reports {
    agent: Agent
    bucket: String
    disposition: [DispoData]
  }

  type AgentDisposition {
    agent: String
    user_id: String
    dispositions: [DispoData]
  }

  type BucketDisposition {
    bucket: String
    dispositions: [DispoData]
  } 
  type PerDay {
    day: String
    amount: String
  }

  type PerMonth {
    month: String
    amount: String
  }


  type DispositionPerDay {
    month: String,
    dispositionsCount: [PerDay]
  }

  type DispositionPerYear {
    year: String,
    dispositionsCount: [PerMonth]
  }

  type DispositionCount {
    count: String
    code: String
  }


  type SubsribeSuccess {
    message: String
    members: [ID]
  }

  type Subscription {
    somethingChanged: SubsribeSuccess
  }


  # type AomDispositionReport {
    


  # }


  type Query {
    getAccountDispositions(id:ID!, limit:Int):[Disposition]
    getDispositionReports(agent:String, bucket:String, disposition:[String], from:String, to:String): Reports
    getAgentDispositions:[AgentDisposition]
    getBucketDisposition:[BucketDisposition]
    getDispositionPerDay:DispositionPerDay
    getDispositionPerMonth:DispositionPerYear
    getDeptDispositionCount:[DispositionCount]
    getAllDispositionTypes:[DispoType]
    # getDispositionReports(campaign:String, bucket:String):AomDispositionReport
  }

  type Mutation {
    createDisposition(customerAccountId:ID!,amount:String, payment:String, disposition: String!, payment_date:String, payment_method:String, ref_no:String, comment:String): Success
  
  }
`

export default dispositionTypeDefs

