import pubsub from "../../middlewares/pubsub.js"
import { PUBSUB_EVENTS } from "../../middlewares/pubsubEvents.js"


const subscriptionsResolver = {
  Subscription: {
    ping: {
      subscribe: () => { 
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.CHECKING])
      }
    },
    somethingOnAgentAccount: {
      subscribe: () => { 
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_ON_AGENT_ACCOUNT])
      }
    },
    agentLocked: {
      subscribe:() =>  { 
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.AGENT_LOCK])
      }
    },
    groupChanging: {
      subscribe:() =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_CHANGED_TOPIC])
      }
    },
    dispositionUpdated: {
      subscribe:() =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.DISPOSITION_UPDATE])
      }
    },
    somethingChanged: {
      subscribe: () => {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_CHANGED_TOPIC])
      }
    },
    newCallfile: {
      subscribe:() =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE])
      }
    },
    updateOnCallfiles: {
      subscribe:() =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.FINISHED_CALLFILE])
      }
    },
    taskChanging: {
      subscribe:  () =>  {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.TASK_CHANGING])
      }
    },
    newBucketMessage: {
      subscribe: () => {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.NEW_BUCKET_MESSAGE])
      }
    },
    accountOffline: {
      subscribe: () => {
        return pubsub.asyncIterableIterator([PUBSUB_EVENTS.OFFLINE_USER])
      }
    }
  }
}

export default subscriptionsResolver

