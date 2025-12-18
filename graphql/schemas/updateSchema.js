import { gql } from "graphql-tag";

const patchUpdateTypeDefs = gql`
  scalar DateTime
  type PatchUpdate {
    _id: ID
    type: String
    title: String
    descriptions: String
    pushPatch: Boolean
    updatedAt: DateTime
  }

  type Information {
    title: String
    descriptions: String
  }

  type PatchConsolidated{
    type: String
    info: [Information]
  }

  input patchUpdatesInput {
    type: String!
    title: String!
    descriptions: String!
  }

  type Query {
    getAllPatchUpdates: [PatchUpdate]
    getPushedPatch: [PatchUpdate]
    getPatchUpdatesConsolidated:[PatchConsolidated]
  }

  type Mutation {
    addPatchUpdate(input: patchUpdatesInput): Success
    updatePatchUpdate(id: ID!, input: patchUpdatesInput): Success
    pushPatch: Success
    removePatch: Success
    deletePatchUpdate(_id: ID!): Success
  }
`;

export default patchUpdateTypeDefs;
