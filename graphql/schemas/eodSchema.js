import { gql } from "graphql-tag";

const eodTypeDefs = gql`
  type EODFile {
    _id: ID!
    user: ID
    name: String
    createdAt: String
  }

  extend type Query {
    getEODFiles: [EODFile]
  }

  extend type Mutation {
    finishEODs: EODFile
  }
`;

export default eodTypeDefs;
