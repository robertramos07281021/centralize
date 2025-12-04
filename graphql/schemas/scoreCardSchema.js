import { gql } from "graphql-tag";

const scoreCardTypeDefs = gql`
  scalar JSON

  type ScoreCardData {
    _id: ID!
    month: String!
    department: ID!
    agentName: ID!
    dateAndTimeOfCall: String!
    number: String!
    assignedQA: ID!
    typeOfScoreCard: String!
    scoreDetails: JSON
    totalScore: Float
    createdAt: String
    updatedAt: String
  }

  type ScoreCardSummary {
    _id: ID!
    agent: User
    qa: User
    department: Department
    month: String!
    number: String!
    typeOfScoreCard: String!
    totalScore: Float
    dateAndTimeOfCall: String!
    createdAt: String
    updatedAt: String
    scoreDetails: JSON
  }

  input ScoreCardDataInput {
    month: String!
    department: ID!
    agentName: ID!
    dateAndTimeOfCall: String!
    number: String!
    assignedQA: ID!
    typeOfScoreCard: String!
    scoreDetails: JSON!
    totalScore: Float!
  }

  extend type Query {
    getScoreCardSummaries(date: String, search: String): [ScoreCardSummary!]!
  }

  type Mutation {
    createScoreCardData(input: ScoreCardDataInput!): ScoreCardData!
  }
`;

export default scoreCardTypeDefs;
