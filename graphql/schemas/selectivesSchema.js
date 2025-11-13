import { gql } from "graphql-tag";

const selectivesTypeDefs = gql`
  type Selectives {
    _id: ID
    name: String
    callfile: Callfile
    bucket: Bucket
    count: Int,
    amount: Float
  }

  type AllSelectiveResult {
    selectives: [Selectives]
    total: Int
  }

  type Query {
    getAllSelectives(page: Int, limit: Int, bucket: ID): AllSelectiveResult
  }
`;

export default selectivesTypeDefs;
