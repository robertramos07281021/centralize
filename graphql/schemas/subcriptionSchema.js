import gql from "graphql-tag";

const subscriptionTypeDefs = gql`

  type SubscriptionSuccess {
    buckets: [ID],
    message: String
  }

  type AgentLockSubsribeSuccess {
    message: String
    agentId: ID
  }

  type SubsribeSuccess {
    message: String
    members: [ID]
  }

  type BucketSubscribeSuccess {
    bucket: ID
    message: String
  }

  type UpdateCAllfile {
    bucket: ID
    message: String
  }

  type MessageBucket {
    bucket: ID,
    message: String
  }

  type Subscription {
    ping: String!,
    somethingOnAgentAccount: SubscriptionSuccess
    agentLocked:AgentLockSubsribeSuccess
    groupChanging: SubsribeSuccess
    dispositionUpdated: SubsribeSuccess
    somethingChanged: SubsribeSuccess
    taskChanging: SubsribeSuccess
    newCallfile: BucketSubscribeSuccess,
    updateOnCallfiles: UpdateCAllfile
    newBucketMessage:MessageBucket
  }

`

export default subscriptionTypeDefs