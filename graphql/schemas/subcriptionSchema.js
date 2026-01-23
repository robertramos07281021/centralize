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

  type UpdateCAllfile {
    bucket: ID
    message: String
  }
  
  type AgentStatus {
    userId: ID,
    status: String,
    subStatus: String
    acctStatus: String
  }

  type Subscription {
    ping: String!,
    somethingOnAgentAccount: SubscriptionSuccess
    agentLocked:AgentLockSubsribeSuccess
    groupChanging: SubsribeSuccess
    dispositionUpdated: SubsribeSuccess
    somethingChanged: SubsribeSuccess
    taskChanging: SubsribeSuccess
    newCallfile: UpdateCAllfile
    updateOnCallfiles: UpdateCAllfile
    newBucketMessage:UpdateCAllfile
    accountOffline:AgentLockSubsribeSuccess
    newUpdateOnBucket:UpdateCAllfile
    newUserLogin:AgentLockSubsribeSuccess
    agentStatusUpdated(userId: ID): AgentStatus
  }
`

export default subscriptionTypeDefs