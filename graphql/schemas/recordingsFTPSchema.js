import gql from "graphql-tag";

const recordingFTPTypeDefs = gql`
  type Recording {
    name: String!
    url: String!
  }

  type Query {
    recordings(limit: Int): [Recording]
  }
`;

export default recordingFTPTypeDefs;
