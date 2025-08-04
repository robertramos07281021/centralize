

const subscriptionsResolver = {
  Subscription: {
    ping: {
      subscribe: (_, __, { pubsub, PUBSUB_EVENTS }) => { 
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.CHECKING])
      }
    },
    somethingOnAgentAccount: {
      subscribe: (_, __, { pubsub, PUBSUB_EVENTS }) => { 
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_ON_AGENT_ACCOUNT])
      }
    },
    agentLocked: {
      subscribe:(_, __, { pubsub, PUBSUB_EVENTS }) =>  { 
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.AGENT_LOCK])
      }
    },
    groupChanging: {
      subscribe:(_, __, { pubsub, PUBSUB_EVENTS}) =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_CHANGED_TOPIC])
      }
    },
    dispositionUpdated: {
      subscribe:(_, __, { pubsub, PUBSUB_EVENTS }) =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.DISPOSITION_UPDATE])
      }
    },
    somethingChanged: {
      subscribe: (_,__,{ pubsub, PUBSUB_EVENTS }) => {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_CHANGED_TOPIC])
      }
    },
    newCallfile: {
      subscribe:(_, __, { pubsub, PUBSUB_EVENTS}) =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE])
      }
    },
    updateOnCallfiles: {
      subscribe:(_, __, { pubsub, PUBSUB_EVENTS }) =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.FINISHED_CALLFILE])
      }
    },
    taskChanging: {
      subscribe:  (_, __, { pubsub, PUBSUB_EVENTS }) =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.TASK_CHANGING])
      }
    },
  }
}

export default subscriptionsResolver

