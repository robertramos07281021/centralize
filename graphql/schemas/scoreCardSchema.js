import { gql } from "graphql-tag";

const scoreCardTypeDefs = gql`
  type ScoreCardData {
    _id: ID!
    month: String!
    department: ID!
    agentName: ID!
    dateAndTimeOfCall: String!
    number: String!
    assignedQA: ID!
    typeOfScoreCard: String!
    createdAt: String
    updatedAt: String
  }

  input ScoreCardDataInput {
    month: String!
    department: ID!
    agentName: ID!
    dateAndTimeOfCall: String!
    number: String!
    assignedQA: ID!
    typeOfScoreCard: String!
  }

  type Mutation {
    createScoreCardData(input: ScoreCardDataInput!): ScoreCardData!
  }
`;

export default scoreCardTypeDefs;
